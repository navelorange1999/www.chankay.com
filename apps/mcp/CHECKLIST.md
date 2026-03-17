# MCP Server 学习路线 — 总进度

基于 RFC.md 的 Delivery Plan，分 5 个阶段循序渐进。
每完成一个任务，在方括号内打 `x`。

---

## Phase 0: App Skeleton — 理解 MCP 协议本质

- [ ] 阅读 MCP spec，用自己的话写一段总结：server、client、tool、resource、transport 各自的职责是什么
- [ ] 选择并安装 MCP SDK（`@modelcontextprotocol/sdk`），理解 `Server` 类的构造参数
- [ ] 实现 `src/config/env.ts` — 环境变量加载与校验
- [ ] 实现 `src/server/createServer.ts` — 创建一个最小可运行的 MCP server（零 tool、零 resource）
- [ ] 实现 `src/transports/stdio.ts` — 用 stdio 连接 server，验证 Claude Desktop 或 MCP Inspector 能发现这个 server
- [ ] 实现 `src/server/registry.ts` — 设计 tool/resource 注册机制，让 createServer 通过 registry 注册 handler

**验证标准**: 用 MCP Inspector 或 Claude Desktop 连接你的 stdio server，能看到 server info 返回，tool list 为空但不报错。

---

## Phase 1: Read-Only Foundation — 掌握 Tool 与 Resource 设计

- [ ] 实现 `src/services/payloadReadClient.ts` — 封装对 apps/admin Payload REST API 的 HTTP 读取
- [ ] 实现第一个 read tool: `src/tools/posts/listPosts.ts`，注册到 registry
- [ ] 实现 `src/tools/posts/getPost.ts`
- [ ] 实现 `src/tools/pages/listPages.ts` 和 `src/tools/pages/getPage.ts`
- [ ] 实现 `src/tools/site/getSiteConfig.ts`
- [ ] 实现 MCP resources: `src/resources/posts.ts`, `src/resources/pages.ts`, `src/resources/site-config.ts`
- [ ] 定义 `src/types/index.ts` — 统一 tool input/output 类型
- [ ] 实现 `src/transports/http.ts` — HTTP transport，让 server 可以通过网络访问
- [ ] 实现 `src/auth/bearer.ts` — 为 HTTP transport 加上 bearer token 保护
- [ ] 定义 `src/auth/scopes.ts` — scope 枚举，即使 Phase 1 只用 `content.read`

**验证标准**: 通过 MCP Inspector 调用 list_posts、get_post，能返回真实数据。HTTP transport 无 token 时拒绝连接。

---

## Phase 2: Writable Post Flow — 理解意图表达与内部委托

- [ ] 实现 `apps/admin/src/services/mcp/auth.ts` — 共享密钥验证中间件
- [ ] 实现 `apps/admin/src/services/mcp/richText.ts` — Markdown → Lexical 转换
- [ ] 实现 `apps/admin/src/services/mcp/posts.ts` — post 变更业务逻辑
- [ ] 实现 `apps/admin/src/app/api/internal/mcp/posts/create/route.ts`
- [ ] 实现 `apps/admin/src/app/api/internal/mcp/posts/update/route.ts`
- [ ] 实现 `apps/admin/src/app/api/internal/mcp/posts/publish/route.ts`
- [ ] 实现 `src/services/adminInternalClient.ts` — MCP app 调用 admin 内部接口的 HTTP client
- [ ] 实现 write tools: `createPostDraft.ts`, `updatePostMetadata.ts`, `replacePostContent.ts`
- [ ] 实现 `publishPost.ts`, `archivePost.ts`
- [ ] 实现 `src/tools/site/revalidatePaths.ts`
- [ ] 为每个 write tool 添加结构化审计日志（tool name, actor, target, status, requestId, timing）

**验证标准**: 通过 MCP Inspector 调用 create_post_draft 传入 markdown，在 admin 后台能看到新 draft post，内容正确转为 Lexical。

---

## Phase 3: Writable Page Flow — 理解 block tree 验证与结构替换

- [ ] 设计 page structure 的 V1 允许 schema（text, markdown, button, card, mediaImage, container, flex, grid）
- [ ] 实现 `apps/admin/src/services/mcp/pages.ts` — page 变更业务逻辑
- [ ] 实现 `apps/admin/src/app/api/internal/mcp/pages/create/route.ts`
- [ ] 实现 `apps/admin/src/app/api/internal/mcp/pages/replace-structure/route.ts`（含 block tree 验证）
- [ ] 实现 `apps/admin/src/app/api/internal/mcp/pages/publish/route.ts`
- [ ] 实现 write tools: `createPageDraft.ts`, `replacePageStructure.ts`, `updatePageSeo.ts`, `publishPage.ts`

**验证标准**: 通过 MCP tool 创建一个包含 container > flex > text 嵌套结构的 page draft，admin 后台能正确显示。

---

## Phase 4: Hardening — 生产级安全与可观测性

- [ ] 为所有 write tools 接入 scope 检查（基于 `src/auth/scopes.ts`）
- [ ] 实现 `src/auth/oauth.ts` — OAuth token 验证（或预留接口）
- [ ] 添加幂等性支持（idempotency key）用于关键 write 操作
- [ ] 审计日志持久化（写入 Payload audit collection 或平台日志）
- [ ] 配置 `vercel.json` 完成部署
- [ ] 端到端测试：从 Claude Desktop 通过 remote HTTP 调用完整 write flow

**验证标准**: 部署到 Vercel，通过远程 MCP client 完成一次完整的 post 创建 → 编辑 → 发布流程，审计日志可查。
