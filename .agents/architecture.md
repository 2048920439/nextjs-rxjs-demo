# 架构设计

> 项目分层、数据流向、设计模式总结。

---

## 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                   app/  (Next.js App Router)              │
│  - layout.tsx: SSR getCurrentUser → Provider             │
│  - page.tsx: useService + useObservableState             │
│  - api/: Route Handlers                                  │
├─────────────────────────────────────────────────────────┤
│               proxy.ts  (Edge Middleware)                 │
│  - auth() 包装: JWT 验证 + 路由重定向                     │
├─────────────────────────────────────────────────────────┤
│              service/  (业务 Service 层)                  │
│  - AuthService: 命令 Subject → Effect → API → 状态 Subject│
├──────────────────┬──────────────────────────────────────┤
│   api-client/    │      service-core/  (DI 框架)          │
│  - axios 实例     │  - BaseService                        │
│  - 拦截器链       │  - ServiceRegistry                    │
│  - 加密通信       │  - PersistSubject                     │
│                  │  - React bindings                     │
├──────────────────┴──────────────────────────────────────┤
│                 shared/  (共享层)                          │
│  - types/auth.ts                                          │
│  - utils/ (serializer, object, promise)                   │
│  - crypto/ (NaCl asymmetric + symmetric)                  │
├─────────────────────────────────────────────────────────┤
│              lib/  (服务端基础设施)                         │
│  - prisma.ts: Prisma 单例                                 │
│  - auth.ts: hashPassword / verifyPassword / getCurrentUser│
│  - crypto-server.ts: 服务端密钥                            │
└─────────────────────────────────────────────────────────┘
```

### 依赖方向

```
app → service → { api-client, service-core } → shared
app → lib (仅服务端)
                lib → shared
```

- `src/lib/` 受 `server-only` 包保护
- `service-core/react/` 均为 `"use client"`
- `src/shared/` 无 `"use client"` 或 `"use server"`，可在两端使用

---

## 数据流向

### 命令-状态分离 (AuthService)

```
用户操作 (命令)                    系统状态
  auth.login(data)  ─→  loginEvent$ (Subject)
                           │
                    loginEffect (pipe)
                           │
                    POST /api/auth/login
                           │
                    ┌──────┴──────┐
                    ↓              ↓
              成功: user$.next()   失败: loginFailed$.next(msg)
              state$.next(LoggedIn)

UI 层通过 useObservableState(auth.user$) 自动响应状态变化
UI 层通过 useObservable(auth.loginFailed$) 响应副作用
```

### SSR → 客户端

```
服务端 layout.tsx:  ─ getCurrentUser() ─→ user: User | null
                          │
            <BasicServiceProvider initUser={user}>
                          │
            客户端: new AuthService(initUser)
                          │
            user$ BehaviorSubject 初始值 = user
```

---

## 核心设计模式

### 1. Effect 命令编排

```
命令流 (Subject) → Effect (RxJS pipe) → API 调用 → 状态写入 (BehaviorSubject)
```

- **Effect 不持状态**: 通过抽象 ctx 接口读写，可独立测试
- **Effect 不依赖 Service**: 纯函数，仅依赖 ctx 接口
- **Service 协调多流**: 构造函数中组装命令、状态、结果等多个 Subject

### 2. DI 容器 + 父子链

```
ServiceRegistry (parent = null)    ← 顶层 Provider
  └── ServiceRegistry (parent)     ← 嵌套 Provider
        └── resolve(AuthService)   → 先查本层 → 沿 parent 回溯
```

- 顶层注册全局服务（如 AuthService）
- 页面级注册局部服务
- 父层持有的实例不会被子层覆盖（单例保证）

### 3. 持久化 BehaviorSubject

```
PersistSubject<T> extends BehaviorSubject<T>
  - next(): 写值 + debounce 1s → PersistCache.set()
  - rehydrate(): PersistCache.get() → super.next()
  - PersistCache: localStorage + TTL + check + encrypt
```

### 4. 拦截器链 (axio)

```
请求 → crypto 拦截器(加密) → 发送 → 响应 → crypto 拦截器(解密) → error 拦截器
```

---

## 实验模块

### service-playground

- 路径: `/service-playground`
- 目的: 实验 Service 层状态管理模式
- 子主题: `01-service-orchestration` — 多 Service 协作

### rxjs 学习

- 路径: `/rxjs`
- 目的: 配合《深入浅出RxJS》书籍的结构化学习内容

---

## 工程规范

| 规范       | 工具        | 配置                                                                        |
| ---------- | ----------- | --------------------------------------------------------------------------- |
| 代码风格   | ESLint 9    | `eslint.config.mjs` (next + prettier + simple-import-sort + unused-imports) |
| 格式化     | Prettier 3  | `.prettierrc`                                                               |
| 提交信息   | commitlint  | `commitlint.config.mjs` (Conventional Commits)                              |
| 提交前检查 | lint-staged | `package.json` → `lint-staged`                                              |
| Git hooks  | Husky 9     | `pre-commit`, `commit-msg`                                                  |
| 文件名     | 自定义脚本  | `scripts/check-filename.mjs`                                                |
