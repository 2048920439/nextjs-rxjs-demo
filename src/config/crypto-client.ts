// 由 scripts/generate-crypto-keys.mjs 自动生成
// 注意：生产环境应替换为真实的密钥并通过环境变量注入

/** PersistCache 对称加密密钥（base64 编码，32 字节） */
export const SYMMETRIC_KEY = "tc/GdgAxR7TMcQQVk+Zd4PdjcgtJa30Ge1bxlM1xqfc=";

/** 客户端私钥 — 用于加密请求数据 */
export const CLIENT_SECRET_KEY = "LBDYUTE5hA9YfUsy94JhqV42XIDNzOWEZET7o7jVTSU=";

/** 服务端公钥 — 用于加密请求数据时指定接收方 */
export const SERVER_PUBLIC_KEY = "3StESFdwpMaj9c6bVJm7ReHAqOs5GFdfj9jPa/ut4iA=";
