# 开发指南

---

## 环境准备

```bash
# 安装依赖
pnpm install

# 环境变量 (已存在则跳过)
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-secret-key-change-in-production"

# 初始化数据库
npx prisma db push
npx prisma generate
```

---

## 常用命令

| 命令                | 说明                 | 端口 |
| ------------------- | -------------------- | ---- |
| `pnpm dev`          | Turbopack 开发服务器 | 9000 |
| `pnpm build`        | 生产构建             | —    |
| `pnpm start`        | 生产服务器           | 9001 |
| `pnpm lint`         | ESLint 检查 (`src/`) | —    |
| `pnpm lint:fix`     | ESLint 自动修复      | —    |
| `pnpm format`       | Prettier 格式化      | —    |
| `pnpm format:check` | 检查格式             | —    |

### 数据库

| 命令                                | 说明                   |
| ----------------------------------- | ---------------------- |
| `npx prisma db push`                | 同步 schema → SQLite   |
| `npx prisma studio`                 | 可视化数据库管理       |
| `npx prisma generate`               | 重新生成 Prisma Client |
| `npx prisma migrate dev --name xxx` | 创建迁移               |

---

## 关键技术约定

### TypeScript

- **strict: true** — 所有代码须通过严格类型检查
- **paths**: `@/*` → `src/*`
- **moduleResolution**: bundler
- **jsx**: react-jsx (React 19 新 JSX Transform)

### 文件命名

- 组件文件: `kebab-case` (如 `basic-service-provider.tsx`)
- 样式文件: `*.module.scss` (SCSS Modules)
- 工具/服务: `kebab-case` (如 `auth.service.ts`)

### 客户端/服务端边界

- `"use client"` 标记的模块:
  - `src/service-core/react/*`
  - `src/app/(pages)/_components/*`
  - 所有页面组件 (`page.tsx`)
- `server-only` 保护的模块:
  - `src/lib/*`
- 两端共享:
  - `src/shared/*` (无指令标记)

### 样式

- 全局变量定义在 `src/app/globals.scss`
- 每个页面/组件配对应的 `*.module.scss`
- 无 Tailwind CSS (虽有文档提及但未实际使用)

### 包管理

- **pnpm** + workspace
- lockfile: `pnpm-lock.yaml`
- node_modules 使用 pnpm 虚拟存储 (`.pnpm-store/`)

---

## Git Hooks

| Hook         | 触发            | 行为                                           |
| ------------ | --------------- | ---------------------------------------------- |
| `pre-commit` | `git commit`    | lint-staged: ESLint auto-fix + Prettier format |
| `commit-msg` | `git commit -m` | commitlint: 强制 Conventional Commits 格式     |

### Commit 消息格式

```
<type>(<scope>): <subject>
// 例: feat(auth): add logout button
//     fix(service-core): resolve parent chain lookup
//     docs: update AGENTS.md
```

---

## 密钥管理

### 生成密钥

```bash
node scripts/generate-crypto-keys.mjs
```

生成后更新:

- `src/config/crypto-client.ts` — `SYMMETRIC_KEY`, `CLIENT_SECRET_KEY`, `SERVER_PUBLIC_KEY`
- `src/config/crypto-server.ts` — `SERVER_SECRET_KEY`

### 环境变量

- `.env` 不提交到 Git（已在 `.gitignore`）
- `JWT_SECRET` — 生产环境须更换
- `DATABASE_URL` — SQLite 文件路径

---

## 调试

- **React Scan**: 全局启用的 React 性能监控组件 (`_components/react-scan.tsx`)
- **Prisma Studio**: 数据库可视化，`npx prisma studio`
- **ESLint 输出**: 检查 `pnpm lint` 结果
- **浏览器 Network**: API 请求体被加密，需查看拦截器日志
