import sharp from "sharp";
import path from "path";
import {fileURLToPath} from "url";
import {lexicalEditor} from "@payloadcms/richtext-lexical";
import {mongooseAdapter} from "@payloadcms/db-mongodb";
import {buildConfig} from "payload";
import {Config} from "@repo/typescript-config/typings/payload-types";

import {Media, Users} from "./collections";
import {Navbar, Footer} from "./globals";

import {plugins} from "./plugins";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
	// If you'd like to use Rich Text, pass your editor here
	editor: lexicalEditor(),

	// Define and configure your collections in this array
	collections: [Users, Media],

	// Define and configure your Globals in this array
	globals: [Navbar, Footer],

	// Your Payload secret - should be a complex and secure string, unguessable
	secret: process.env.PAYLOAD_SECRET || "",

	// Whichever Database Adapter you're using should go here
	// Mongoose is shown as an example, but you can also use Postgres
	db: mongooseAdapter({
		url: process.env.DATABASE_URI || "",
	}),
	// If you want to resize images, crop, set focal point, etc.
	// make sure to install it and pass it to the config.
	// This is optional - if you don't need to do these things,
	// you don't need it!
	sharp,

	routes: {
		admin: "/",
	},

	typescript: {
		autoGenerate: true,
		declare: false,
		outputFile: path.resolve(
			dirname,
			"../../../packages/typescript-config/typings/payload-types.ts"
		),
	},

	plugins: [...plugins],

	admin: {
		user: Users.slug,

		autoLogin:
			process.env.NODE_ENV === "development"
				? {
						username: "local",
						password: "local",
					}
				: false,
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
});

declare module "payload" {
	export interface GeneratedTypes extends Config {}
}
