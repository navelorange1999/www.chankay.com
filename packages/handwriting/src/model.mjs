import { normalizeInput } from "./schema.js"
// Independent inference adapter for the publicly served Calligrapher tensor format.
// Tensor names and alphabet IDs are part of that model's serialization contract.
const MODEL_STYLE_INDICES = [44, 54, 23, 1, 19, 6, 30, 11, 21]
const alphabet = [
	"",
	"",
	"",
	"",
	'"',
	"M",
	"r",
	".",
	" ",
	"A",
	"z",
	"u",
	"m",
	"i",
	"a",
	"n",
	"'",
	"s",
	"S",
	"e",
	"c",
	"t",
	"y",
	"I",
	"w",
	"o",
	"l",
	"d",
	"k",
	"p",
	"h",
	"T",
	"b",
	"g",
	"v",
	"f",
	"O",
	",",
	"N",
	"V",
	"-",
	"H",
	"E",
	"j",
	"x",
	"G",
	"P",
	"B",
	"L",
	"q",
	"Y",
	"?",
	"D",
	"F",
	"W",
	"R",
	"#",
	"C",
	"K",
	"1",
	"9",
	"5",
	"0",
	"2",
	"J",
	"U",
	"(",
	")",
	"4",
	"3",
	"7",
	"6",
	"!",
	";",
	":",
	"Q",
	"8",
	"/",
	"Z",
	"X",
	"*",
	"[",
	"+",
	"]",
	"&",
]
const charIds = new Map(alphabet.slice(4).map((char, i) => [char, i + 4]))
const shapes = {
	q: [1024],
	w: [1024, 768],
	e: [256],
	r: [1024, 512],
	t: [256],
	y: [1024, 512],
	u: [1],
	i: [3, 256],
	o: [256],
	p: [1024],
	a: [256],
	s: [85, 256],
	d: [256],
	f: [1024],
	g: [80, 64],
	h: [256, 30],
	j: [512, 256],
	k: [64, 256],
	l: [256, 512],
	z: [256, 121],
	x: [256],
	c: [256, 1],
	v: [121],
	b: [3, 256, 256],
	n: [30],
	m: [256],
	Q: [256],
	W: [256],
	E: [256],
	R: [256],
	T: [256],
}
const sparseNames = new Set(["y", "w", "r", "l"])

export function createRandom(seed = 42) {
	if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
		throw new Error("Seed must be an unsigned 32-bit integer.")
	let state = seed >>> 0
	return () => {
		state = (state + 0x6d2b79f5) >>> 0
		let value = Math.imul(state ^ (state >>> 15), state | 1)
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
		return (((value ^ (value >>> 14)) >>> 0) + 0.5) / 4294967296
	}
}

export function parseModel(buffer) {
	if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 16 || buffer.byteLength > 8_000_000)
		throw new Error("Invalid model size.")
	const view = new DataView(buffer),
		tensors = Object.create(null)
	let cursor = 0
	const requireBytes = (n) => {
		if (cursor + n > buffer.byteLength) throw new Error("Truncated model.")
	}
	const u8 = () => {
		requireBytes(1)
		return view.getUint8(cursor++)
	}
	const u16 = () => {
		requireBytes(2)
		const n = view.getUint16(cursor, true)
		cursor += 2
		return n
	}
	const u32 = () => {
		requireBytes(4)
		const n = view.getUint32(cursor, true)
		cursor += 4
		return n
	}
	while (cursor < buffer.byteLength) {
		if (u8() !== 1) throw new Error("Unknown tensor name.")
		const name = String.fromCharCode(u8())
		if (!Object.hasOwn(shapes, name) || Object.hasOwn(tensors, name))
			throw new Error("Unexpected or duplicate tensor.")
		const packed = u8(),
			count = u32()
		if (packed > 1 || count > 1_000_000) throw new Error("Invalid tensor size.")
		requireBytes(count * 4)
		const values = new Float32Array(count)
		for (let i = 0; i < count; i++) {
			values[i] = view.getFloat32(cursor, true)
			cursor += 4
			if (!Number.isFinite(values[i])) throw new Error("Invalid tensor value.")
		}
		const deltas = packed ? Uint8Array.from({ length: count }, u8) : null
		const rank = u8()
		if (rank < 1 || rank > 3) throw new Error("Invalid tensor rank.")
		const shape = Array.from({ length: rank }, u16)
		if (String(shape) !== String(shapes[name])) throw new Error(`Invalid ${name} tensor shape.`)
		const total = shape.reduce((a, b) => a * b, 1)
		if (!packed && count !== total) throw new Error("Invalid dense tensor length.")
		if (sparseNames.has(name) && !packed) throw new Error("Expected sparse tensor.")
		if (sparseNames.has(name)) {
			let position = 0
			const weights = [],
				columns = [],
				rows = new Uint32Array(shape[0] + 1)
			for (let i = 0; i < count; i++) {
				position += deltas[i]
				if (position >= total) throw new Error("Sparse index out of bounds.")
				if (values[i] !== 0) {
					weights.push(values[i])
					columns.push(position % shape[1])
					rows[Math.floor(position / shape[1]) + 1]++
				}
			}
			for (let i = 1; i < rows.length; i++) rows[i] += rows[i - 1]
			tensors[name] = {
				values: Float32Array.from(weights),
				columns: Uint16Array.from(columns),
				rows,
			}
		} else if (packed) {
			const dense = new Float32Array(total)
			let position = 0
			for (let i = 0; i < count; i++) {
				position += deltas[i]
				if (position >= total) throw new Error("Packed index out of bounds.")
				dense[position] = values[i]
			}
			tensors[name] = dense
		} else tensors[name] = values
	}
	if (Object.keys(tensors).length !== Object.keys(shapes).length)
		throw new Error("Missing model tensors.")
	return tensors
}

const vector = (n) => new Float32Array(n)
const sigmoid = (x) => 1 / (1 + Math.exp(-x))
const softplus = (x) => (x > 20 ? x : Math.log1p(Math.exp(x)))
const cat = (a, b) => {
	const out = vector(a.length + b.length)
	out.set(a)
	out.set(b, a.length)
	return out
}
const add = (a, b) => a.map((v, i) => v + b[i])
const residual = (a, b) => a.map((v, i) => (v + b[i]) * Math.SQRT1_2)
function dense(input, weights) {
	const width = weights.length / input.length,
		output = vector(width)
	for (let c = 0; c < width; c++) {
		let sum = 0
		for (let r = 0; r < input.length; r++) sum += input[r] * weights[r * width + c]
		output[c] = sum
	}
	return output
}
function sparse(input, tensor) {
	const out = vector(tensor.rows.length - 1)
	for (let row = 0; row < out.length; row++) {
		let value = 0
		for (let i = tensor.rows[row]; i < tensor.rows[row + 1]; i++)
			value += tensor.values[i] * input[tensor.columns[i]]
		out[row] = value
	}
	return out
}
function softmax(input) {
	const maximum = Math.max(...input),
		out = input.map((v) => Math.exp(v - maximum))
	const sum = out.reduce((a, b) => a + b, 0)
	return out.map((v) => v / sum)
}

function encode(text, model) {
	const ids = [0, 2, ...[...text].map((c) => charIds.get(c)), 3, 0]
	const embedded = ids.map((id) => model.s.slice(id * 256, (id + 1) * 256))
	const result = []
	for (let row = 1; row < ids.length - 1; row++) {
		const window = cat(cat(embedded[row - 1], embedded[row]), embedded[row + 1])
		const convolution = add(dense(window, model.b), model.t).map(Math.tanh)
		result.push(add(dense(cat(embedded[row], convolution), model.j), model.E))
	}
	return result
}

function lstm(input, state, weights, bias) {
	const gates = add(sparse(cat(input, state.hidden), weights), bias)
	const memory = vector(256),
		hidden = vector(256)
	for (let i = 0; i < 256; i++) {
		// Serialized gate order: input, candidate, forget, output.
		memory[i] =
			sigmoid(gates[i + 512]) * state.memory[i] + sigmoid(gates[i]) * Math.tanh(gates[i + 256])
		hidden[i] = sigmoid(gates[i + 768]) * Math.tanh(memory[i])
	}
	state.memory = memory
	state.hidden = hidden
	return hidden
}

function attention(hidden, state, encoded, model) {
	const params = add(dense(hidden, model.h), model.n)
	const mass = softmax(params.slice(0, 10))
	const widths = params.slice(10, 20).map(softplus)
	const steps = params.slice(20).map(softplus)
	for (let i = 0; i < 10; i++) state.positions[i] += steps[i] / 15
	const output = vector(256)
	for (let row = 0; row < encoded.length; row++) {
		let weight = 0
		for (let i = 0; i < 10; i++) {
			const left = sigmoid((row - 0.5 - state.positions[i]) / widths[i])
			const right = sigmoid((row + 0.5 - state.positions[i]) / widths[i])
			weight += mass[i] * (right - left)
		}
		for (let c = 0; c < 256; c++) output[c] += weight * encoded[row][c]
	}
	state.context = output
	return output
}

function sample(head, bias, random) {
	const penUp = random() < sigmoid(head[120]) ? 1 : 0
	const logits = vector(20)
	for (let i = 0; i < 20; i++) logits[i] = head[i * 6]
	const probabilities = softmax(logits)
	let best = -Infinity,
		chosen = 0
	for (let i = 0; i < 20; i++) {
		let score = Math.log(probabilities[i]) * (1 + bias)
		if (score < Math.log(0.02)) score -= 100
		score -= Math.log(-Math.log(random()))
		if (score > best) {
			best = score
			chosen = i
		}
	}
	const offset = chosen * 6
	const sx = softplus(head[offset + 1]) / Math.exp(bias)
	const sy = softplus(head[offset + 2]) / Math.exp(bias)
	const rho = Math.tanh(head[offset + 3])
	const normal = () =>
		Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * (1 - random()))
	const a = normal(),
		b = normal()
	return Float32Array.of(
		head[offset + 4] + sx * a,
		head[offset + 5] + sy * (rho * a + Math.sqrt(Math.max(0, 1 - rho * rho)) * b),
		penUp
	)
}

export function* generate(model, input, { style = 8, legibility = 0.85, seed = 42 } = {}) {
	const text = normalizeInput({ text: input }).text
	if (!Number.isInteger(style) || style < 0 || style >= MODEL_STYLE_INDICES.length)
		throw new Error("Invalid style.")
	if (!Number.isFinite(legibility) || legibility < 0.15 || legibility > 2.5)
		throw new Error("Invalid legibility.")
	const random = createRandom(seed),
		encoded = encode(text, model)
	const styleVector = model.g.slice(
		MODEL_STYLE_INDICES[style] * 64,
		(MODEL_STYLE_INDICES[style] + 1) * 64
	)
	const state = {
		layers: [
			{ memory: model.d.slice(), hidden: model.m.slice() },
			{ memory: model.o.slice(), hidden: model.x.slice() },
			{ memory: model.e.slice(), hidden: model.a.slice() },
		],
		positions: vector(10),
		context: model.T.slice(),
		style: add(dense(styleVector, model.k), model.R),
	}
	let last = Float32Array.of(0, 0, 1),
		x = 0,
		y = 0
	for (let step = 0; step < text.length * 40; step++) {
		let trunk = residual(add(dense(last, model.i), model.W), state.style)
		const first = lstm(trunk, state.layers[0], model.y, model.p)
		trunk = residual(trunk, first)
		const second = lstm(cat(trunk, state.context), state.layers[1], model.w, model.q)
		const context = attention(second, state, encoded, model)
		const projected = add(sparse(cat(second, context), model.l), model.Q).map(Math.tanh)
		trunk = residual(trunk, projected)
		const stop = sigmoid(dense(context, model.c)[0] + model.u[0])
		const third = lstm(trunk, state.layers[2], model.r, model.f)
		trunk = residual(trunk, third)
		last = sample(add(dense(trunk, model.z), model.v), legibility, random)
		if (stop > 0.5) return { complete: true, steps: step }
		x += last[0]
		y -= last[1]
		if (!Number.isFinite(x) || !Number.isFinite(y))
			throw new Error("Model produced invalid coordinates.")
		yield [x, y, last[2]]
	}
	return { complete: false, steps: text.length * 40 }
}
