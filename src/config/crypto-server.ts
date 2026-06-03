// 由 scripts/generate-crypto-keys.mjs 自动生成
// 注意：生产环境应替换为真实的密钥并通过环境变量注入

import "server-only";

/** 客户端公钥 — 用于解密请求数据时验证发送方 */
export const CLIENT_PUBLIC_KEY = "ybcZOq8bzKhWRnftYEd9cEveRfkTQSYZsIHG/DSv6QA=";

/** 服务端私钥 — 用于解密请求数据 */
export const SERVER_SECRET_KEY = "6QN3in7dRh/aoOT2quxsTV+HGw8gHi1BXL4DX1DAcnQ=";
