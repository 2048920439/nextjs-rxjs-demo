# Next.js + RxJS 学习项目

基于 [Next.js 16](https://nextjs.org) 和 [RxJS 7](https://rxjs.dev) 的全栈项目，探索**响应式编程**在现代 Web 应用中的实践模式。内置完整的 JWT 认证系统、基于 RxJS 的轻量级 DI 服务框架，以及严谨的工程化规范。

## 技术栈

| 类别   | 技术                                                 |
| ------ | ---------------------------------------------------- |
| 框架   | Next.js 16 (App Router)、React 19                    |
| 响应式 | RxJS 7                                               |
| 数据库 | Prisma 6 + SQLite                                    |
| 认证   | jose (JWT) + bcryptjs + httpOnly Cookie              |
| 校验   | zod 4                                                |
| HTTP   | axios                                                |
| 样式   | Tailwind CSS 4 + SCSS Module                         |
| 语言   | TypeScript 5                                         |
| 工程化 | ESLint + Prettier + Husky + commitlint + lint-staged |

## 项目结构

```
src/
├── api-client/               # HTTP 通信层
│   ├── client.ts             #   axios 实例（Cookie 认证、错误拦截）
│   └── auth.ts               #   auth API 调用函数
├── app/                      # Next.js App Router
│   ├── (pages)/              #   业务页面路由组
│   │   ├── (auth)/           #     认证页面（login / register）
│   │   ├── dashboard/        #     仪表盘
│   │   ├── _components/      #     app 内部通用组件
│   │   ├── layout.tsx        #     SSR 用户状态 → 客户端 Service 注入
│   │   └── page.tsx          #     首页
│   ├── api/auth/             #   API 路由处理器
│   │   └── [...path]/route.ts #   合并 login / register / logout / me
│   └── layout.tsx            #   根布局（metadata + react-scan）
├── lib/                      # 服务端工具库
│   ├── auth.ts               #   密码哈希 / JWT 签发验证 / Cookie 操作
│   ├── jwt-secret.ts         #   JWT 密钥访问器
│   └── prisma.ts             #   Prisma 单例
├── service/                  # 客户端 Service 层（业务逻辑）
│   └── auth.service.ts       #   AuthService（继承 BaseService，管理用户状态流）
├── service-core/             # 响应式服务框架（架构层）
│   ├── core/                 #   核心：DI 容器 / 生命周期 / 持久化
│   │   ├── base-service.ts
│   │   ├── service-registry.ts
│   │   ├── create-token.ts
│   │   ├── persist-cache.ts
│   │   └── persist-subject.ts
│   ├── react/                #   React 绑定层
│   │   ├── service-registry-provider.tsx
│   │   ├── use-service.ts
│   │   └── use-observable.ts
│   └── index.ts              #   barrel 统一导出
├── shared/                   # 前后端共享
│   ├── types/auth.ts         #   API 类型定义（User / LoginInput / RegisterInput）
│   └── utils/object.ts       #   通用工具函数
└── proxy.ts                  # Edge 中间件（路由守卫 + JWT 验证）
```

## 架构分层

```
 ┌────────────────────────────────────────────┐
 │  app/                   路由 & 页面         │
 │  proxy.ts               Edge 中间件         │
 ├────────────────────────────────────────────┤
 │  api-client/            HTTP 通信           │
 │  service/               业务 Service        │
 │  service-core/          DI 框架 + 响应式    │
 ├────────────────────────────────────────────┤
 │  shared/                共享类型 & 工具     │
 │  lib/                   服务端基础设施       │
 └────────────────────────────────────────────┘
```

## Service-Core 服务框架

项目实现了一个基于 RxJS 的轻量级 DI 框架，核心能力：

| 模块                      | 说明                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| `BaseService`             | 服务基类，提供 `hydrate` / `mount` / `unmount` 生命周期钩子               |
| `ServiceRegistry`         | DI 容器，支持 `register` / `resolve` / 父子链回溯                         |
| `createToken`             | 创建带类型信息的 `InjectionToken`                                         |
| `PersistSubject`          | 自动持久化到 `localStorage` 的 `BehaviorSubject`（支持 TTL + 有效性校验） |
| `PersistCache`            | 底层缓存管理器，封装 `localStorage` 读写、TTL 过期、数据校验              |
| `ServiceRegistryProvider` | React Context Provider，驱动生命周期                                      |
| `useService`              | 从 DI 容器获取 Service 实例                                               |
| `useObservableState`      | 订阅 Observable 并驱动组件渲染（浅比较优化）                              |

### 示例：AuthService

```ts
export class AuthService extends BaseService {
  private _user$ = new BehaviorSubject<AuthState>(this.initState);
  readonly user$ = this._user$.asObservable();

  constructor(private initState: AuthState) {
    super();
  }

  async login(data: LoginInput): Promise<User> {
    const user = await loginApi(data);
    this._user$.next(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await logoutApi();
    } finally {
      this._user$.next(null);
    }
  }
}
```

### 使用方式

```tsx
// 1. 在 layout 中注入（SSR 状态 → 客户端 Service）
const user = await getCurrentUser();
<BasicServiceProvider authState={user}>{children}</BasicServiceProvider>;

// 2. 在组件中使用
const auth = useService(AuthService);
const user = useObservableState(auth.user$, () => auth.user);
```

## 认证系统

基于 JWT + httpOnly Cookie 的无状态认证：

- **注册 / 登录** — zod 校验输入，bcryptjs 哈希密码，jose 签发 JWT
- **会话管理** — `auth_token` httpOnly Cookie（7 天有效期）
- **路由守卫** — `proxy.ts` Edge 中间件拦截未认证请求
- **防时序攻击** — 登录时对不存在用户也执行 bcrypt 比较
- **SSR 状态传递** — 服务端 `getCurrentUser()` → `BasicServiceProvider` → 客户端 `useService(AuthService)`

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env：设置 JWT_SECRET

# 3. 初始化数据库
npx prisma db push

# 4. 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 脚本命令

| 命令                | 说明                      |
| ------------------- | ------------------------- |
| `pnpm dev`          | 启动 Turbopack 开发服务器 |
| `pnpm build`        | 构建生产版本              |
| `pnpm start`        | 启动生产服务器            |
| `pnpm lint`         | ESLint 代码检查           |
| `pnpm lint:fix`     | 自动修复 ESLint 问题      |
| `pnpm format`       | Prettier 格式化           |
| `pnpm format:check` | 检查代码格式              |

## Git Hooks

- **pre-commit** — `lint-staged` 自动格式化 + ESLint 修复
- **commit-msg** — `commitlint` 校验 Conventional Commits 规范
