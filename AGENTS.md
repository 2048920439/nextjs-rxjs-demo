# Project Wiki: rxjs

> Next.js 16 + RxJS 7 全栈学习项目 — 响应式编程实践 + 自研 DI 服务框架 + JWT 认证。
> 详细文档在 `.agents/` 目录，按专题组织。

---

## 快速索引

| 需要了解                            | 阅读                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| 完整目录树 & 文件职责               | [`.agents/directory-structure.md`](.agents/directory-structure.md) |
| 项目架构、分层设计、数据流向        | [`.agents/architecture.md`](.agents/architecture.md)               |
| Service-Core DI 框架详细文档        | [`.agents/service-core.md`](.agents/service-core.md)               |
| 认证系统 (JWT/路由守卫/AuthService) | [`.agents/auth.md`](.agents/auth.md)                               |
| 数据模型、加密体系、序列化工具      | [`.agents/data-model.md`](.agents/data-model.md)                   |
| 路由地图、页面组件、布局层级        | [`.agents/routing.md`](.agents/routing.md)                         |
| 开发命令、环境配置、Git Hooks       | [`.agents/development.md`](.agents/development.md)                 |

---

## 项目概览

| 维度   | 说明                                           |
| ------ | ---------------------------------------------- |
| 目标   | 学习 RxJS + Next.js + 自研 Service DI 框架     |
| 参考书 | `books/深入浅出rxjs/` (EPUB, 200+ 章节)        |
| 实验区 | `/service-playground` — Service 层状态管理模式 |
| 学习区 | `/rxjs` — RxJS 概念学习                        |

### 技术栈

Next.js 16 + React 19 + RxJS 7 + Prisma 6 (SQLite) + TypeScript 5 + SCSS Modules + pnpm

### 关键路径

| 路径                | 用途                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| `src/service-core/` | 自研 DI 框架 (BaseService / Registry / PersistSubject / React bindings) |
| `src/service/auth/` | AuthService + Effect 命令编排                                           |
| `src/app/(pages)/`  | 业务页面 (首页/登录/注册/RxJS学习/Service实验)                          |
| `src/app/api/`      | API Route Handlers                                                      |
| `src/proxy.ts`      | Edge 中间件 (路由守卫)                                                  |
| `src/api-client/`   | HTTP 通信层 (axios + crypto 拦截器)                                     |
| `src/lib/`          | 服务端工具 (Prisma / JWT / bcrypt)                                      |
| `src/shared/`       | 前后端共享 (类型 / 工具 / 加密)                                         |

### 开发

```bash
pnpm dev            # 开发服务器 (端口 9000)
pnpm build          # 生产构建
pnpm lint           # ESLint 检查
npx prisma db push  # 同步数据库
```

---

## 架构速览

```
app (页面/API) → proxy.ts (路由守卫)
  → service/ (业务Service) → service-core/ (DI框架)
  → api-client/ (HTTP) → shared/ (共享)
  → lib/ (服务端, server-only)
```

核心模式: **命令 Subject → Effect (RxJS pipe) → API 调用 → 状态 BehaviorSubject → UI 自动响应**
