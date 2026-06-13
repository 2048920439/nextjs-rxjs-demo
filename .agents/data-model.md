# 数据模型 & 加密体系

---

## Prisma 数据模型

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcryptjs 哈希
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- 数据库文件: `prisma/dev.db`
- ORM Client: `src/lib/prisma.ts` (单例)

---

## 共享类型 (`src/shared/types/auth.ts`)

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  createdAt: number; // Unix timestamp
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}
```

---

## Serializable 系统 (`src/shared/utils/serializer.ts`)

增强 JSON 序列化，支持 Date / Map / Set / RegExp：

```typescript
type Serializable =
  | string
  | number
  | boolean
  | null
  | Date
  | RegExp
  | Serializable[]
  | { [key: string]: Serializable }
  | Map<Serializable, Serializable>
  | Set<Serializable>;

enhancedStringify(value); // Date → {"__q_type":"Date","v":timestamp}
enhancedParse(raw); // 还原原始类型
```

用于 `PersistCache` 的 localStorage 存储。

---

## 双层加密体系

### 传输加密 — NaCl Box (非对称)

| 密钥                | 位置                          | 用途       |
| ------------------- | ----------------------------- | ---------- |
| `CLIENT_SECRET_KEY` | `src/config/crypto-client.ts` | 客户端私钥 |
| `SERVER_PUBLIC_KEY` | `src/config/crypto-client.ts` | 服务端公钥 |
| `SERVER_SECRET_KEY` | `src/config/crypto-server.ts` | 服务端私钥 |

- 实现在 `src/shared/crypto/asymmetric.ts`
- axios 拦截器 `src/api-client/_instance/interceptors/crypto.ts` 自动加解密

### 存储加密 — NaCl Secretbox (对称)

| 密钥            | 位置                          | 用途                           |
| --------------- | ----------------------------- | ------------------------------ |
| `SYMMETRIC_KEY` | `src/config/crypto-client.ts` | PersistCache localStorage 加密 |

- 实现在 `src/shared/crypto/symmetric.ts`
- `PersistCache` 中 `encrypt: true` 时启用

### 密钥生成

```bash
node scripts/generate-crypto-keys.mjs
# 自动生成 base64 编码的 NaCl 密钥对并更新 config 文件
```

---

## Utility 模块

### `src/shared/utils/object.ts`

| 函数                 | 说明                        |
| -------------------- | --------------------------- |
| `has(obj, key)`      | 类型安全的 `hasOwnProperty` |
| `pick(obj, keys)`    | 提取对象子集                |
| `omit(obj, keys)`    | 排除指定键                  |
| `shallowEqual(a, b)` | 浅比较 (支持 Map/Set/Date)  |

### `src/shared/utils/promise/`

| 模块               | 说明             |
| ------------------ | ---------------- |
| `polling.ts`       | 轮询工具         |
| `promise-queue.ts` | Promise 队列     |
| `retry.ts`         | 重试机制         |
| `utils.ts`         | Promise 通用工具 |
| `index.ts`         | 统一导出         |
