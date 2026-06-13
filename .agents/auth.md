# 认证系统

> JWT + httpOnly Cookie 无状态认证，含路由守卫和 SSR 状态传递。
> 涉及文件: `src/auth.ts`, `src/proxy.ts`, `src/lib/auth.ts`, `src/service/auth/`, `src/api-client/auth.ts`, `src/app/api/auth/`

---

## 认证流程

### 登录

```
LoginPage 表单提交
  → auth.login({ email, password })   (发送命令到 loginEvent$ Subject)
  → loginEffect 订阅                  (src/service/auth/effects.ts)
  → loginApi(data)                    (src/api-client/auth.ts)
  → axios POST /api/auth/login        (crypto 拦截器自动加密)
  → Route Handler 验证密码 + 签发 JWT (src/app/api/auth/login/route.ts)
  → Set-Cookie: auth_token=JWT; HttpOnly; ...
  → 返回 { user }
  → loginEffect: ctx.loginSuccess(user)
      → user$.next(user)              (BehaviorSubject)
      → userState$.next(LoggedIn)
      → loginResult$.next({ state: "success" })
  → UI: loginSuccess$ 触发 router.push("/")
```

### 注册

```
RegisterPage 表单提交
  → auth.register({ email, password, name })
  → registerEffect
  → registerApi → POST /api/auth/register
  → 注册成功自动签发 JWT (等同于登录)
  → user$.next(user) → UI 自动跳转
```

### 登出

```
LogoutButton 点击
  → auth.logout()
  → logoutEffect
  → logoutApi() → signOut({ redirect: false })
  → ctx.logoutSuccess()
      → user$.next(null)
      → userState$.next(LoggedOut)
```

### 页面刷新 — SSR 状态还原

```
layout.tsx (服务端)
  → getCurrentUser()  → auth()  ← next-auth 从 Cookie 解析 JWT
  → 返回 User | null
  → <BasicServiceProvider initUser={user}>
  → ServiceRegistryProvider factory: new AuthService(initUser)
  → 客户端: useService(AuthService) → user$ 初始值 = SSR 传递的用户
```

---

## 路由守卫 (`src/proxy.ts`)

### 保护规则

| 条件                                | 行为                                  |
| ----------------------------------- | ------------------------------------- |
| 访问 `/dashboard` 未认证            | 重定向到 `/login?redirect=/dashboard` |
| 访问 `/login` 或 `/register` 已认证 | 重定向到 `/dashboard`                 |
| API 路由                            | 不拦截（自行处理认证）                |
| 静态资源                            | 不拦截                                |

### 中间件配置

```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)"],
};
```

### x-pathname Header

中间件注入 `x-pathname` 请求头，下游服务端组件可通过 `headers()` 读取当前路径。

---

## AuthService 状态模型

```
                    ┌──────────────┐
    login() ──────→ │   Loading    │ ←── register()
                    └──────┬───────┘
                           │
              ┌────────────┤
              ↓            ↓
        ┌──────────┐  ┌──────────┐
        │ LoggedIn │  │ LoggedOut│
        └──────────┘  └──────────┘
              │            ↑
        logout() ──────────┘
```

### 数据流

```
命令 Subject         Effect           API              状态 BehaviorSubject
─────────────       ────────         ───              ─────────────────────
loginEvent$    →   loginEffect   →  loginApi()    →   user$.next(user)
registerEvent$ →   registerEffect→  registerApi() →   userState$.next(...)
logoutEvent$   →   logoutEffect  →  logoutApi()   →   结果 Subject
                                                      loginResult$.next(...)
```

---

## 安全措施

| 措施            | 说明                                    |
| --------------- | --------------------------------------- |
| httpOnly Cookie | JS 无法读取 `auth_token`，防止 XSS 窃取 |
| bcrypt 哈希     | 10 salt rounds，防彩虹表                |
| 防时序攻击      | 不存在的用户也执行 bcrypt.compare       |
| JWT 7天过期     | jose 签发，iat/exp 标准字段             |
| 传输加密        | axios crypto 拦截器 NaCl box 加密请求体 |
| Zod 校验        | 所有 API 输入经 Zod schema 校验         |

---

## 关键文件索引

| 文件                                      | 职责                                                   |
| ----------------------------------------- | ------------------------------------------------------ |
| `src/auth.ts`                             | NextAuth 配置 (jose JWT, Credentials provider)         |
| `src/proxy.ts`                            | Edge 中间件：路由守卫                                  |
| `src/lib/auth.ts`                         | 服务端: hashPassword / verifyPassword / getCurrentUser |
| `src/service/auth/auth.service.ts`        | 客户端 AuthService                                     |
| `src/service/auth/effects.ts`             | login/register/logout Effect                           |
| `src/service/auth/types.ts`               | LoginStatus / AuthEffectCtx / AuthResult               |
| `src/api-client/auth.ts`                  | loginApi / registerApi / logoutApi / getMe             |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 全路由                                    |
| `src/app/api/auth/login/route.ts`         | 登录 API Handler                                       |
| `src/app/api/auth/register/route.ts`      | 注册 API Handler                                       |
| `src/app/api/auth/me/route.ts`            | 当前用户 API Handler                                   |
