# 多语言生产就绪设计

## 背景

`feat/i18n` 已完成英文和简体中文的核心能力，包括共享 locale 配置、路由、Payload
本地化、数据查询、SEO、sitemap、缓存失效、数据迁移和语言切换器。本次补齐固定 UI
文案、SiteConfig 可编辑字段和关键回归测试。

完成后只推送 `feat/i18n`，不合并 `master`，不发布生产。

## 目标

- 本地化 Posts、文章详情、404 等固定界面文案。
- 按当前 locale 格式化日期和阅读时长。
- 让导航与 Footer 的可编辑文本支持 Payload 多语言。
- 覆盖路径、SEO alternates、字符串、格式化、middleware 和迁移的自动化测试。
- 更新多语言文档并推送当前分支。

## 非目标

- 合并 `master` 或发布生产。
- 翻译现有 CMS 内容。
- 增加新语言、第三方 i18n 框架或多语言 slug。

## 设计

### 固定 UI 文案

在 `@repo/i18n` 增加类型安全的文案字典，覆盖：

- Posts 标题、引导语、描述、空状态和阅读链接。
- 阅读时长、返回文章列表、目录标题。
- 404 的 metadata 和页面内容。
- 无标题文章的 fallback。

每个 `SupportedLocale` 必须提供完整字典；新增 locale 时缺少文案会触发 TypeScript 错误。

### 日期与阅读时长

在 `@repo/i18n` 提供 locale-aware 格式化工具。日期使用 `Intl.DateTimeFormat`，阅读时长
使用对应语言文案。页面必须显式传入路由 locale。

### CMS 可编辑文本

仅给以下叶子字段增加 `localized: true`：

- `navigation.menuItems[].label`
- `footer.copyrightText`
- `footer.additionalLinks[].label`

数组结构、URL、external 标记和布局配置保持共享。新增幂等迁移，将旧值包装到默认 locale，
并把纯转换逻辑导出供测试使用。

## 测试

按 red-green-refactor 实施：

- `@repo/i18n`：路径、alternates、文案、日期和阅读时长。
- `admin`：SiteConfig 迁移，包括裸值、已本地化值、空值、嵌套数组和二次执行幂等性。
- `www`：middleware rewrite/pass-through 和页面 SEO alternates。
- 最终运行相关测试、全仓测试、类型检查；在无需读取真实环境文件且配置可用时运行 build。

## 文档与交付

更新多语言架构和 rollout runbook，记录新增字段、迁移和生产检查项。验证通过后创建聚焦提交，
推送 `feat/i18n` 到 origin，保持 `master` 不变。

## 兼容性

- 请求中的 locale 必须先通过 `isSupportedLocale` 校验。
- 无效日期继续返回空展示值。
- 迁移忽略缺失、null 和已本地化的数据。
- Payload fallback 继续启用，未翻译 CMS 字段仍显示英文。
