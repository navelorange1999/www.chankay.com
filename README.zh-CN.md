# www.chankay.com

> 基于 Next.js、PayloadCMS 和 TypeScript 构建的现代化全栈博客平台，采用 monorepo 架构。

[English README | 英文文档](./README.md)

[![pnpm](https://img.shields.io/badge/package%20manager-pnpm-blue?logo=pnpm)](https://pnpm.io/)
[![TurboRepo](https://img.shields.io/badge/monorepo-turbo-7B3DF9?logo=turbo)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/frontend-next.js-000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-19.1.0-61DAFB?logo=react)](https://react.dev/)
[![Payload CMS](https://img.shields.io/badge/cms-payload-1A2238?logo=payloadcms)](https://payloadcms.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prettier](https://img.shields.io/badge/code_style-prettier-F7B93E?logo=prettier)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/lint-eslint-4B32C3?logo=eslint)](https://eslint.org/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen?logo=commitizen)](http://commitizen.github.io/cz-cli/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Storybook](https://raw.githubusercontent.com/storybooks/brand/master/badge/badge-storybook.svg)](./apps/storybook/)

## 🚀 项目概览

一个综合性的博客平台，采用现代化 Web 技术构建，专注于性能优化、开发者体验和内容管理灵活性。使用 Turborepo monorepo 架构，包含多个应用程序和共享包。

## 📁 项目结构

```
www.chankay.com/
├── 📱 apps/
│   ├── admin/          # PayloadCMS 管理后台
│   ├── storybook/      # 组件开发环境
│   └── www/            # 公开访问的网站
├── 📦 packages/
│   ├── eslint-config/  # 共享 ESLint 配置
│   ├── tailwind-config/ # 共享 Tailwind CSS 设置
│   ├── typescript-config/ # TypeScript 配置和类型定义
│   └── ui/             # 共享 UI 组件库
└── 🔧 配置文件
```

## ✨ 功能特性

### ✅ 已实现功能

- **🏗️ Monorepo 基础架构** - 基于 Turborepo 的统一工作流
- **📝 内容管理** - 功能完整的 PayloadCMS 与自定义字段
- **🎨 UI 组件** - 共享组件库与 Storybook
- **🔧 开发者体验** - TypeScript、ESLint、Prettier 与预提交钩子
- **🌍 国际化** - 多语言支持与自定义翻译系统
- **🎯 SEO 优化** - 基于 PayloadCMS SEO 插件的自动化 SEO 管理
- **🎨 颜色管理** - 自定义颜色选择器组件确保品牌一致性
- **🔐 身份验证** - NextAuth.js 集成与 GitHub OAuth
- **📊 类型安全** - 端到端 TypeScript 与自动生成类型
- **🚀 性能优化** - 优化的构建和缓存策略

### 🧩 自定义组件

- **颜色选择器** - 基于 react-colorful 的 PayloadCMS 颜色选择器
- **翻译系统** - 模块化翻译适配器（OpenAI、DeepL、Google、百度）
- **语言检测** - 自动内容语言检测
- **自定义字段类型** - PayloadCMS 可复用字段组件

## 🛠️ 技术栈

### 核心技术

- **前端框架**: Next.js 15.3+ 与 App Router
- **React**: 19.1+ 现代特性
- **内容管理**: PayloadCMS 3.46+
- **编程语言**: TypeScript 5+ 严格模式
- **样式**: TailwindCSS 设计系统
- **Monorepo**: Turborepo 构建编排

### 开发工具

- **包管理器**: pnpm 工作区支持
- **代码质量**: ESLint + Prettier + lint-staged
- **测试**: Vitest 测试覆盖率
- **文档**: Storybook 组件开发
- **CI/CD**: GitHub Actions 与 Vercel 部署

### 数据存储

- **数据库**: MongoDB 与 Mongoose ODM
- **文件存储**: Vercel Blob 媒体资源
- **身份验证**: NextAuth.js OAuth 提供商

## 🚀 快速开始

### 环境要求

- Node.js 18+ 和 pnpm
- MongoDB 数据库（本地或远程）
- 环境变量配置

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/www.chankay.com.git
cd www.chankay.com

# 安装依赖
pnpm install

# 设置环境变量
cp apps/admin/.env.example apps/admin/.env.local
cp apps/www/.env.example apps/www/.env.local
# 填入你的环境变量

# 生成 TypeScript 类型
pnpm run gen:types

# 启动开发服务器
pnpm run dev
```

### 可用脚本

```bash
# 开发
pnpm run dev          # 启动所有开发服务器
pnpm run dev:admin    # 仅启动管理后台
pnpm run dev:www      # 仅启动公开网站

# 构建
pnpm run build        # 构建所有应用程序
pnpm run build:admin  # 构建管理后台
pnpm run build:www    # 构建公开网站

# 代码质量
pnpm run lint         # 在所有包上运行 ESLint
pnpm run format       # 使用 Prettier 格式化代码
pnpm run check-types  # TypeScript 类型检查

# 测试
pnpm run test         # 运行所有测试
pnpm run test:watch   # 在监视模式下运行测试

# Storybook
pnpm run storybook    # 启动 Storybook 开发服务器
```

### 生产发布标签

生产部署在 GitHub 发布 Release 时按标签前缀触发：

- `admin-v*` 触发 Admin 生产工作流
- `www-v*` 触发 WWW 生产工作流

操作步骤（GitHub 页面）：

1. 打开 `Releases` -> `Draft a new release`
2. 创建或选择标签：
   - `admin-v1.2.3` 发布 Admin
   - `www-v1.2.3` 发布 WWW
3. 点击 `Publish release`

## 🔧 开发指南

### 添加新功能

1. **创建功能分支**: 遵循 git flow 使用描述性分支名
2. **使用类型开发**: 全程使用 TypeScript 确保类型安全
3. **组件开发**: 使用 Storybook 进行独立组件开发
4. **编写测试**: 为新功能编写测试
5. **代码质量**: 确保 ESLint 和 Prettier 合规性
6. **提交**: 遵循常规提交格式与基于范围的提交

### PayloadCMS 自定义

自定义字段组件位于 `apps/admin/src/components/fields/`：

- ColorPicker 组件用于品牌颜色管理
- `apps/admin/src/fields/` 中的工厂函数用于可复用性

### 翻译系统

翻译系统支持多种提供商：

- **OpenAI**: 基于 GPT 的技术内容翻译
- **DeepL**: 高质量通用翻译
- **Google Translate**: 广泛的语言支持
- **百度翻译**: 针对中文翻译的优化
- **Mock**: 开发和测试

## 📈 当前进度

### ✅ 已完成（基础设施阶段）

- [x] **Monorepo 设置**: 带共享包的 Turborepo
- [x] **PayloadCMS 集成**: 带集合的管理后台
- [x] **认证系统**: NextAuth.js 与 OAuth
- [x] **TypeScript 配置**: Monorepo 严格类型
- [x] **代码质量工具**: ESLint、Prettier、预提交钩子
- [x] **SEO 插件**: 自动化元标签管理
- [x] **自定义组件**: 颜色选择器和表单字段
- [x] **翻译系统**: 多提供商翻译架构
- [x] **开发工作流**: 测试、构建和部署流水线

### 🚧 进行中（前端阶段）

- [ ] **公开网站设计**: 首页和布局实现
- [ ] **博客界面**: 文章列表和详情页
- [ ] **内容集成**: 从 PayloadCMS 动态获取内容
- [ ] **主题系统**: 深色/浅色模式切换实现

### 📋 计划中（增强阶段）

- [ ] **高级功能**:
  - [ ] 站点搜索功能
  - [ ] 评论系统集成
  - [ ] RSS 订阅生成
  - [ ] 实时预览系统
- [ ] **性能优化**:
  - [ ] 图片优化和懒加载
  - [ ] 内容缓存策略
  - [ ] 渐进式 Web 应用功能
- [ ] **分析监控**:
  - [ ] 性能监控
  - [ ] 错误追踪
  - [ ] 用户分析集成

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 遵循我们的提交约定（查看 `.claude/config` 了解指南）
4. 确保所有测试通过 (`pnpm run test`)
5. 提交带详细描述的 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 使用现代 Web 技术和最佳实践构建
- 受到 Next.js 和 PayloadCMS 社区启发
- 感谢所有贡献者和开源项目使这一切成为可能
