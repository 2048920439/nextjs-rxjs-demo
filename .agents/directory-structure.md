# 项目目录结构

## 顶层

| 路径                | 说明                               |
| ------------------- | ---------------------------------- |
| `AGENTS.md`         | 项目知识库导航入口                 |
| `.agents/`          | 专题文档目录                       |
| `books/`            | 《深入浅出RxJS》EPUB 电子书        |
| `prisma/`           | Prisma schema + SQLite 数据库      |
| `scripts/`          | 工具脚本 (密钥生成、文件名检查)    |
| `src/`              | 应用源码                           |
| `public/`           | 静态资源                           |
| `.next/`            | Next.js 构建产物 (gitignored)      |
| `.husky/`           | Git hooks (pre-commit, commit-msg) |
| `.pnpm-store/`      | pnpm 全局存储                      |
| `package.json`      | 依赖与脚本                         |
| `tsconfig.json`     | TypeScript 配置                    |
| `next.config.ts`    | Next.js 配置                       |
| `.env`              | 环境变量                           |
| `eslint.config.mjs` | ESLint 配置                        |
| `.prettierrc`       | Prettier 配置                      |

## src/ 源码

```
src/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # 根布局: metadata + ReactScan
│   ├── globals.scss                # 全局 SCSS 变量与基础样式
│   ├── not-found.tsx               # 404 页面
│   ├── (pages)/                    # 业务页面路由组 (不影响 URL)
│   │   ├── layout.tsx              # SSR 获取用户 → BasicServiceProvider 注入
│   │   ├── page.tsx                # 首页 (认证状态驱动渲染)
│   │   ├── (auth)/                 # 认证页面组
│   │   │   ├── login/page.tsx      # 登录 (命令式 login + 事件流跳转)
│   │   │   └── register/page.tsx   # 注册
│   │   ├── rxjs/                   # RxJS 学习模块
│   │   │   ├── layout.tsx          # 侧边栏目录布局
│   │   │   └── page.tsx            # 学习首页
│   │   ├── service-playground/     # Service 模式实验场
│   │   │   ├── layout.tsx          # 侧边栏目录布局
│   │   │   ├── page.tsx            # 实验场首页
│   │   │   └── 01-service-orchestration/
│   │   │       └── page.tsx        # 实验 01: 服务编排
│   │   └── _components/            # 页面级共享组件
│   │       ├── basic-service-provider.tsx  # 全局 Service 注入 (AuthService)
│   │       ├── react-scan.tsx              # React Scan 性能监控初始化
│   │       └── logout-button/              # 登出按钮组件
│   ├── api/                        # API Route Handlers (服务端)
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth 全路由 (login/register/logout/me)
│   │   │   ├── login/route.ts          # 登录 API
│   │   │   ├── register/route.ts       # 注册 API
│   │   │   └── me/route.ts             # 当前用户 API
│   │   └── mock/
│   │       ├── delay/route.ts          # 模拟延迟响应
│   │       └── random/route.ts         # 模拟随机数据
│   └── (components)/               # 全局通用组件
│       └── code-block/              # 代码高亮块 (highlight.js)
├── service-core/                   # 自研 DI 服务框架
│   ├── index.ts                    # 统一导出
│   ├── core/                       # 框架核心
│   │   ├── index.ts                # barrel export
│   │   ├── base-service.ts         # 服务基类 (生命周期 + Effects + PersistSubject)
│   │   ├── service-registry.ts     # DI 容器 (register/resolve/has + parent链)
│   │   ├── create-token.ts         # 类型安全 InjectionToken
│   │   ├── effect.ts               # Effect<T> 类型定义 + registerEffects
│   │   ├── persist-cache.ts        # localStorage 缓存管理器
│   │   └── persist-subject.ts      # 自动持久化 BehaviorSubject
│   └── react/                      # React 绑定层
│       ├── index.ts                # barrel export
│       ├── service-registry-context.ts   # React Context 定义
│       ├── service-registry-provider.tsx # Provider (生命周期驱动)
│       ├── use-service.ts                # useService hook
│       └── use-observable.ts             # useObservable / useObservableState
├── service/                        # 业务 Service
│   └── auth/                       # 认证服务
│       ├── index.ts                # barrel export
│       ├── auth.service.ts         # AuthService (用户状态 + 命令流)
│       ├── effects.ts              # login/register/logout Effect
│       └── types.ts                # LoginStatus 枚举 + AuthEffectCtx 接口
├── api-client/                     # HTTP 通信层 (客户端)
│   ├── index.ts                    # barrel export
│   ├── auth.ts                     # login/register/logout/getMe 函数
│   ├── mock.ts                     # mock API 函数
│   └── _instance/
│       ├── index.ts                # barrel export
│       ├── basic-client.ts         # axios 实例 (baseURL/Cookie/拦截器)
│       └── interceptors/
│           ├── index.ts            # 拦截器集合导出
│           ├── crypto.ts           # NaCl box 加解密拦截器
│           ├── error.ts            # 错误处理拦截器
│           └── utils/
│               ├── types.ts        # 拦截器类型定义
│               └── with.ts         # 拦截器工具函数
├── lib/                            # 服务端工具库 (含 server-only 保护)
│   ├── auth.ts                     # hashPassword / verifyPassword / getCurrentUser
│   ├── prisma.ts                   # Prisma Client 单例
│   └── crypto-server.ts            # 服务端 NaCl 密钥配置
├── config/                         # 配置文件
│   ├── crypto-client.ts            # 客户端密钥 (SYMMETRIC_KEY / CLIENT_SECRET_KEY / SERVER_PUBLIC_KEY)
│   └── crypto-server.ts            # 服务端密钥
├── shared/                         # 前后端共享
│   ├── types/
│   │   └── auth.ts                 # User / LoginInput / RegisterInput 类型
│   ├── utils/
│   │   ├── object.ts               # has / pick / omit / shallowEqual
│   │   ├── serializer.ts           # enhancedStringify / enhancedParse (Date/Map/Set/RegExp)
│   │   └── promise/                # 异步工具
│   │       ├── index.ts
│   │       ├── polling.ts          # 轮询
│   │       ├── promise-queue.ts    # 并发控制队列
│   │       ├── retry.ts            # 重试
│   │       └── utils.ts            # 辅助函数
│   └── crypto/                     # NaCl 加密工具
│       ├── index.ts
│       ├── asymmetric.ts           # 非对称加密 (box)
│       └── symmetric.ts            # 对称加密 (secretbox)
├── auth.ts                         # NextAuth 配置 (auth/handlers/signIn/signOut)
└── proxy.ts                        # Edge 中间件 (路由守卫)
```

## prisma/

```
prisma/
├── schema.prisma    # 数据模型: User (id, email, password, name, timestamps)
└── dev.db           # SQLite 数据库文件 (gitignored)
```

## scripts/

```
scripts/
├── generate-crypto-keys.mjs    # 生成 NaCl 密钥对并写入 config/
└── check-filename.mjs          # 检查 src/ 下文件命名是否符合规范
```
