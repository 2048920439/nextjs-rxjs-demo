# 路由 & 页面

---

## 路由地图

| 路径                                           | 源文件                                                                 | 类型 | 说明                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------- | ---- | ---------------------------------------------- |
| `/`                                            | `src/app/(pages)/page.tsx`                                             | 页面 | 首页 — 根据认证状态显示欢迎信息或登录/注册链接 |
| `/login`                                       | `src/app/(pages)/(auth)/login/page.tsx`                                | 页面 | 登录表单                                       |
| `/register`                                    | `src/app/(pages)/(auth)/register/page.tsx`                             | 页面 | 注册表单                                       |
| `/rxjs`                                        | `src/app/(pages)/rxjs/page.tsx`                                        | 页面 | RxJS 学习首页                                  |
| `/service-playground`                          | `src/app/(pages)/service-playground/page.tsx`                          | 页面 | Service 实验场首页                             |
| `/service-playground/01-service-orchestration` | `src/app/(pages)/service-playground/01-service-orchestration/page.tsx` | 页面 | 实验: Service 编排                             |
| `/api/auth/[...nextauth]`                      | `src/app/api/auth/[...nextauth]/route.ts`                              | API  | NextAuth 全路由                                |
| `/api/auth/login`                              | `src/app/api/auth/login/route.ts`                                      | API  | 登录端点                                       |
| `/api/auth/register`                           | `src/app/api/auth/register/route.ts`                                   | API  | 注册端点                                       |
| `/api/auth/me`                                 | `src/app/api/auth/me/route.ts`                                         | API  | 获取当前用户                                   |
| `/api/mock/delay`                              | `src/app/api/mock/delay/route.ts`                                      | API  | 模拟延迟接口                                   |
| `/api/mock/random`                             | `src/app/api/mock/random/route.ts`                                     | API  | 模拟随机数据                                   |
| `*` (404)                                      | `src/app/not-found.tsx`                                                | 页面 | 未匹配路由                                     |

---

## 布局层级

```
RootLayout (src/app/layout.tsx)
  └── <html lang="zh-CN"> → globals.scss → metadata("RxJS App")
        └── <body> → <main>
              │
              ├── PageLayout (src/app/(pages)/layout.tsx)   ← 路由组
              │     ├── ReactScanInit                        ← 性能监控
              │     └── BasicServiceProvider                 ← SSR user → AuthService
              │           ├── / (page.tsx)                   ← 首页
              │           ├── /login (page.tsx)              ← 登录
              │           ├── /register (page.tsx)         ← 注册
              │           ├── /rxjs (page.tsx)               ← RxJS 学习
              │           │     └── rxjs/layout.tsx          ← RxJS 子布局
              │           └── /service-playground (page.tsx) ← 实验场
              │                 └── layout.tsx                ← 实验场子布局
              │
              ├── /api/auth/[...nextauth] (route.ts)
              ├── /api/auth/login (route.ts)
              └── ...其他 API 路由

              └── * → not-found.tsx
```

### 关键区别

- **(pages)** 路由组: 括号文件夹不影响 URL 路径，仅用于逻辑分组
- **(auth)** 路由组: 认证页面逻辑分组
- **(components)** 路由组: 全局组件文件夹，不被路由到

---

## 路由守卫规则 (`src/proxy.ts`)

```
受保护路径:
  /dashboard, /dashboard/* → 未认证 → 重定向 /login?redirect=原路径

认证页面:
  /login, /register → 已认证 → 重定向 /dashboard

排除:
  /api/*            → 自行处理认证
  /_next/*          → 静态资源
  /favicon.ico      → 图标
  *.svg/png/jpg...  → 媒体文件
```

### 中间件注入

```typescript
// proxy.ts 注入 x-pathname header
requestHeaders.set("x-pathname", pathname);
// 下游服务端组件可通过 headers() 读取
```

---

## 页面组件模式

### 标准页面结构

```typescript
"use client";

import { AuthService } from "@/service/auth";
import { useObservableState, useService } from "@/service-core";
import styles from "./page.module.scss";

export default function Page() {
  const auth = useService(AuthService);
  const state = useObservableState(auth.some$, () => auth.some);

  return (
    <div className={styles.wrapper}>
      {/* 组件内容 */}
    </div>
  );
}
```

### 共享 Provider

`src/app/(pages)/_components/basic-service-provider.tsx`:

- 所有业务页面共享
- 注册全局 Service（AuthService 等）
- 接收 SSR 传递的初始状态

```typescript
<BasicServiceProvider initUser={user}>
  {children}
</BasicServiceProvider>
```

---

## SCSS 样式约定

| 规则      | 说明                                    |
| --------- | --------------------------------------- |
| 文件命名  | `*.module.scss`                         |
| 全局变量  | `src/app/globals.scss` (CSS 自定义属性) |
| 组件样式  | 与组件同目录，`styles.module.scss`      |
| 页面样式  | 与页面同目录，`page.module.scss`        |
| 布局样式  | `layout.module.scss`                    |
| Not Found | `not-found.module.scss`                 |
