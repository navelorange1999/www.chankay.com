FROM node:24.10.0-alpine AS builder

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/typescript-config/configs packages/typescript-config/configs
COPY packages/wechat-relay-protocol/package.json packages/wechat-relay-protocol/package.json
COPY apps/wechat-relay/package.json apps/wechat-relay/package.json

RUN pnpm install --frozen-lockfile --filter @chankay/wechat-relay...

COPY packages/wechat-relay-protocol/tsconfig.json packages/wechat-relay-protocol/tsconfig.json
COPY packages/wechat-relay-protocol/src packages/wechat-relay-protocol/src
COPY apps/wechat-relay/tsconfig.json apps/wechat-relay/tsconfig.json
COPY apps/wechat-relay/src apps/wechat-relay/src

RUN pnpm --filter @chankay/wechat-relay-protocol build && \
    pnpm --filter @chankay/wechat-relay build

FROM node:24.10.0-alpine

WORKDIR /app

COPY --from=builder /workspace/apps/wechat-relay/package.json ./package.json
COPY --from=builder /workspace/apps/wechat-relay/dist ./dist
COPY --from=builder /workspace/packages/wechat-relay-protocol/package.json ./node_modules/@chankay/wechat-relay-protocol/package.json
COPY --from=builder /workspace/packages/wechat-relay-protocol/dist ./node_modules/@chankay/wechat-relay-protocol/dist

USER node
EXPOSE 8787

CMD ["node", "dist/server.js"]
