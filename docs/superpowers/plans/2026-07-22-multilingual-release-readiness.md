# 多语言生产就绪实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**目标：** 补齐固定 UI 文案、SiteConfig 叶子字段本地化和多语言关键回归测试，并推送
`feat/i18n`。

**架构：** 固定系统文案与格式化能力进入 `@repo/i18n`；编辑可配置文本继续由 Payload
管理。所有行为先写失败测试，再实现最小改动。

**技术栈：** TypeScript、Next.js 15、Payload CMS、Vitest、pnpm workspace。

---

### 任务 1：建立 `@repo/i18n` 测试与固定文案 API

**文件：**

- 修改：`packages/i18n/package.json`
- 修改：`packages/i18n/src/index.ts`
- 新建：`packages/i18n/src/strings.ts`
- 新建：`packages/i18n/src/format.ts`
- 新建：`packages/i18n/src/__tests__/i18n.test.ts`

- [ ] 写失败测试，验证路径、alternates、英中文案、日期和阅读时长。
- [ ] 运行 `pnpm --filter @repo/i18n test:run`，确认因 API 不存在失败。
- [ ] 实现 `getUiStrings(locale)`、`formatLocalizedDate(value, locale)` 和
      `formatReadingTime(minutes, locale)`，并从 package root 导出。
- [ ] 将 `test`/`test:run` 改为 Vitest，增加 `vitest` devDependency。
- [ ] 重跑测试与 typecheck，确认通过。
- [ ] 提交：`feat(i18n): add localized interface strings`。

核心 API：

```ts
export function getUiStrings(locale: SupportedLocale): UiStrings
export function formatLocalizedDate(
  value: string | Date | null | undefined,
  locale: SupportedLocale
): string | undefined
export function formatReadingTime(minutes: number, locale: SupportedLocale): string
```

### 任务 2：接入 www 固定文案和格式化

**文件：**

- 修改：`apps/www/src/app/[locale]/(frontend)/posts/page.tsx`
- 修改：`apps/www/src/app/[locale]/(frontend)/posts/[slug]/page.tsx`
- 修改：`apps/www/src/app/[locale]/(frontend)/[[...slug]]/page.tsx`
- 修改：`apps/www/src/app/[locale]/not-found.tsx`
- 新建：`apps/www/src/components/LocalizedNotFound.tsx`
- 修改：`apps/www/src/utils/posts.ts`

- [ ] 先扩展 i18n 测试，覆盖页面需要的全部字典 key，并确认缺失时失败。
- [ ] Posts 列表和详情通过 locale 获取字典，不再硬编码英文。
- [ ] `formatPostDate` 接收 locale 并委托给 `formatLocalizedDate`。
- [ ] 常规 Page/Post 404 metadata 使用 locale 字典；404 可见内容通过 client component 的
      `useParams()` 读取 locale，静态 metadata 保留英文兜底。
- [ ] 运行 i18n 测试、www typecheck，确认通过。
- [ ] 提交：`feat(www): localize interface copy`。

### 任务 3：SiteConfig 字段与幂等迁移

**文件：**

- 修改：`apps/admin/src/globals/SiteConfig.ts`
- 新建：`apps/admin/src/migrations/20260722120000_localize_site_config_labels.ts`
- 新建：`apps/admin/src/migrations/__tests__/localize_site_config_labels.test.ts`

- [ ] 写失败测试，覆盖裸值、已本地化值、null、数组嵌套和二次执行。
- [ ] 运行聚焦测试，确认转换函数不存在导致失败。
- [ ] 给三个叶子字段增加 `localized: true`。
- [ ] 实现 `transformSiteConfigLabels(doc, wrap)`；migration 的 `up/down` 复用该函数并仅
      `$set` 发生变化的字段。
- [ ] 重跑聚焦测试和 admin typecheck，确认通过。
- [ ] 提交：`feat(admin): localize site config labels`。

### 任务 4：www middleware 回归测试

**文件：**

- 修改：`apps/www/package.json`
- 新建：`apps/www/src/__tests__/middleware.test.ts`

- [ ] 写 middleware 失败测试：`/` rewrite 到 `/en`，`/posts/a` rewrite 到
      `/en/posts/a`，`/zh-CN/posts/a` pass-through。
- [ ] 将路径决策提取成 `resolveMiddlewareRewrite(pathname)` 纯函数并由 middleware 复用。
- [ ] 将 www 的 `test`/`test:run` 改为 Vitest 并增加 devDependency。
- [ ] 运行 `pnpm --filter www test:run` 与 www typecheck，确认通过。
- [ ] 提交：`test(i18n): cover routing and metadata`。

### 任务 5：文档与全量验证

**文件：**

- 修改：`docs/proposals/multilingual-architecture.md`
- 修改：`docs/proposals/multilingual-rollout-runbook.md`
- 修改：`docs/payload-cms-patterns.md`
- 修改：`pnpm-lock.yaml`

- [ ] 更新字段表、固定文案规则、迁移顺序和生产 smoke checklist。
- [ ] 执行 `pnpm install --lockfile-only` 同步 lockfile。
- [ ] 运行 `pnpm test:run`。
- [ ] 运行 `pnpm check-types`。
- [ ] 运行 `pnpm lint` 和 `git diff --check`。
- [ ] 在不读取真实 `.env*` 的前提下尝试 `pnpm build`；若缺少运行配置，记录准确阻塞。
- [ ] 提交：`docs(i18n): update multilingual rollout guidance`。

### 任务 6：推送功能分支

**文件：** 无。

- [ ] 确认工作树干净、提交历史和 `origin/feat/i18n..HEAD`。
- [ ] 推送 `feat/i18n` 到 `origin`。
- [ ] 确认远端分支已更新。
- [ ] 保持 `master` 不变，不创建生产发布操作。
