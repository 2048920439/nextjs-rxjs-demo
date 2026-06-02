# 完全去除 Tailwind CSS，迁移至 SCSS + CSS Module

## Context

项目当前使用 Tailwind CSS v4（`@import "tailwindcss"`），PostCSS 仅用于 Tailwind 插件。共有 5 个 TSX 文件使用了 Tailwind 工具类，需要全部迁移至 SCSS Module 方案。项目已有 `sass` 和 `clsx` 依赖，符合项目代码规范中「复杂样式必须 SCSS Module」的约定。

## 变更概览

| 操作 | 文件数                                                                  |
| ---- | ----------------------------------------------------------------------- |
| 删除 | 3（tailwindcss、@tailwindcss/postcss、postcss.config.mjs、globals.css） |
| 新建 | 6（1 个全局 SCSS + 5 个组件 SCSS Module）                               |
| 修改 | 6（5 个 TSX 组件 + 1 个 layout.tsx + package.json）                     |

---

## Task 1: 移除 Tailwind 依赖与配置

**1.1 卸载 npm 包**

```bash
pnpm remove tailwindcss @tailwindcss/postcss
```

**1.2 删除文件**

- `postcss.config.mjs` — Tailwind 移除后不再需要 PostCSS 插件配置
- `src/app/globals.css` — 其唯一内容 `@import "tailwindcss"` 将被全局 SCSS 替代

---

## Task 2: 创建全局 SCSS Reset 文件

**新建 `src/app/globals.scss`**，替代 Tailwind 的 preflight reset，包含：

- 盒模型 reset（`box-sizing: border-box`）
- 默认 margin/padding 清除
- HTML/Body 基础字体与颜色
- 表单元素字体继承
- 链接默认样式重置
- `:focus-visible` outline
- 平滑滚动（prefers-reduced-motion 适配）

**修改 `src/app/layout.tsx`**：`import "./globals.css"` → `import "./globals.scss"`

---

## Task 3: 迁移 `src/app/(pages)/page.tsx`（首页）

**新建 `src/app/(pages)/page.module.scss`**

| 类名           | SCSS 属性                                                                                                             | 对应 Tailwind                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `.wrapper`     | `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1.5rem` | `flex min-h-screen flex-col items-center justify-center gap-6`    |
| `.title`       | `font-size: 2.25rem; font-weight: 700`                                                                                | `text-4xl font-bold`                                              |
| `.actions`     | `display: flex; align-items: center; gap: 1rem`                                                                       | `flex items-center gap-4`                                         |
| `.loadingText` | `color: #9ca3af`                                                                                                      | `text-gray-400`                                                   |
| `.greeting`    | `color: #4b5563`                                                                                                      | `text-gray-600`                                                   |
| `.btnBlue`     | `border-radius: 0.375rem; background: #2563eb; padding: 0.5rem 1rem; color: #fff; &:hover { background: #1d4ed8 }`    | `rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700`   |
| `.btnGreen`    | `border-radius: 0.375rem; background: #16a34a; padding: 0.5rem 1rem; color: #fff; &:hover { background: #15803d }`    | `rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700` |

**修改 TSX**：添加 `import styles from "./page.module.scss"`，所有 `className="..."` 替换为 `className={styles.xxx}`

---

## Task 4: 迁移 `src/app/(pages)/dashboard/page.tsx`（Dashboard）

**新建 `src/app/(pages)/dashboard/page.module.scss`**

| 类名         | SCSS 属性                                                                                         | 对应 Tailwind                       |
| ------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `.container` | `max-width: 42rem; margin: 0 auto; padding: 2rem`                                                 | `mx-auto max-w-2xl p-8`             |
| `.title`     | `margin-bottom: 1.5rem; font-size: 1.875rem; font-weight: 700`                                    | `mb-6 text-3xl font-bold`           |
| `.card`      | `border-radius: 0.5rem; background: #fff; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1)` | `rounded-lg bg-white p-6 shadow-md` |
| `.cardTitle` | `margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600`                                       | `mb-4 text-xl font-semibold`        |
| `.info`      | `color: #4b5563; > * + * { margin-top: 0.5rem }`                                                  | `space-y-2 text-gray-600`           |
| `.label`     | `font-weight: 500`                                                                                | `font-medium`                       |
| `.actions`   | `margin-top: 1.5rem`                                                                              | `mt-6`                              |
| `.back`      | `margin-top: 2rem`                                                                                | `mt-8`                              |
| `.backLink`  | `color: #2563eb; &:hover { text-decoration: underline }`                                          | `text-blue-600 hover:underline`     |

**修改 TSX**：添加 CSS Module 导入，全部替换 className

---

## Task 5: 迁移 `src/app/(pages)/dashboard/logout-button.tsx`（退出按钮）

**新建 `src/app/(pages)/dashboard/logout-button.module.scss`**

| 类名      | SCSS 属性                                                                                                                                                                   | 对应 Tailwind                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `.button` | `border-radius: 0.375rem; background: #dc2626; padding: 0.5rem 1rem; color: #fff; &:hover { background: #b91c1c }; &:disabled { cursor: not-allowed; background: #fca5a5 }` | `rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-300` |

**修改 TSX**：添加 CSS Module 导入，单 className 替换

---

## Task 6: 迁移 `src/app/(pages)/(auth)/login/page.tsx`（登录页）

**新建 `src/app/(pages)/(auth)/login/page.module.scss`**

| 类名                | SCSS 属性                                                                                                                                                                                                                                                | 对应 Tailwind                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.page`             | `display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9fafb`                                                                                                                                                    | `flex min-h-screen items-center justify-center bg-gray-50`                                                                                          |
| `.card`             | `width: 100%; max-width: 28rem; border-radius: 0.5rem; background: #fff; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1)`                                                                                                                           | `w-full max-w-md rounded-lg bg-white p-8 shadow-md`                                                                                                 |
| `.title`            | `margin-bottom: 1.5rem; text-align: center; font-size: 1.5rem; font-weight: 700`                                                                                                                                                                         | `mb-6 text-center text-2xl font-bold`                                                                                                               |
| `.form`             | `> * + * { margin-top: 1rem }`                                                                                                                                                                                                                           | `space-y-4`                                                                                                                                         |
| `.error`            | `border-radius: 0.25rem; background: #fef2f2; padding: 0.75rem; font-size: 0.875rem; color: #dc2626`                                                                                                                                                     | `rounded bg-red-50 p-3 text-sm text-red-600`                                                                                                        |
| `.label`            | `display: block; font-size: 0.875rem; font-weight: 500; color: #374151`                                                                                                                                                                                  | `block text-sm font-medium text-gray-700`                                                                                                           |
| `.input`            | `display: block; width: 100%; margin-top: 0.25rem; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); &:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 1px #3b82f6 }` | `mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500` |
| `.submitBtn`        | `width: 100%; border-radius: 0.375rem; padding: 0.5rem 1rem; color: #fff; font-weight: 500; transition: background-color 0.15s`                                                                                                                          | 基础按钮                                                                                                                                            |
| `.submitBtnActive`  | `background: #2563eb; &:hover { background: #1d4ed8 }`                                                                                                                                                                                                   | `bg-blue-600 hover:bg-blue-700`                                                                                                                     |
| `.submitBtnLoading` | `cursor: not-allowed; background: #93c5fd`                                                                                                                                                                                                               | `cursor-not-allowed bg-blue-300`                                                                                                                    |
| `.hint`             | `margin-top: 1rem; text-align: center; font-size: 0.875rem; color: #6b7280`                                                                                                                                                                              | `mt-4 text-center text-sm text-gray-500`                                                                                                            |
| `.link`             | `color: #2563eb; &:hover { text-decoration: underline }`                                                                                                                                                                                                 | `text-blue-600 hover:underline`                                                                                                                     |

**修改 TSX**：使用 `clsx(styles.submitBtn, loading ? styles.submitBtnLoading : styles.submitBtnActive)` 替代原 `clsx("w-full ...", loading ? "..." : "...")`

---

## Task 7: 迁移 `src/app/(pages)/(auth)/register/page.tsx`（注册页）

**新建 `src/app/(pages)/(auth)/register/page.module.scss`** — 与 login 结构相同，仅按钮颜色为绿色系：

- `.submitBtnActive`: `background: #16a34a; &:hover { background: #15803d }`
- `.submitBtnLoading`: `cursor: not-allowed; background: #86efac`

**修改 TSX**：与 login 相同模式

---

## Task 8: 更新 package.json

- `format` / `format:check` scripts 的 glob 补充 `.scss` 后缀：`"src/**/*.{ts,tsx,css,scss,mjs}"`

---

## Task 9: 验证

执行以下命令，确保全部通过：

```bash
pnpm build        # Next.js 生产构建（验证 SCSS 编译、CSS Module 类型生成）
pnpm lint         # ESLint 检查
pnpm format:check # Prettier 格式检查
```

---

## 注意事项

1. **登录/注册页 SCSS 重复**：两个 `page.module.scss` 结构相同仅按钮颜色不同。当前项目规模小，保持独立文件。未来可抽取 shared `_auth-form.scss` mixin。
2. **focus ring 还原**：`focus:ring-1 focus:ring-blue-500` 用 `box-shadow: 0 0 0 1px #3b82f6` 精确还原，因为 `ring` 在 Tailwind 中即使用 box-shadow 实现。
3. **Link 组件样式**：`<Link className={styles.btnBlue}>` 会将 CSS Module 类名传递到渲染的 `<a>` 标签上，`display: inline-block` 需在 SCSS 中显式声明以保证 `rounded-md` 效果。
4. **SCSS 类名使用 camelCase**：`styles.loadingText`、`styles.cardTitle` 等，符合 TypeScript 访问习惯。
