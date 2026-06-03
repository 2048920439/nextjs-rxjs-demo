/**
 * 服务端加解密单例（NaCl box）
 *
 * 双向通信：解密客户端请求 + 加密服务端响应。
 * 延迟初始化：仅在 login/register 等加密接口调用时创建。
 */

import { CLIENT_PUBLIC_KEY, SERVER_SECRET_KEY } from "@/config/crypto-server";
import { createBox } from "@/shared/crypto";
import type { createBox as CreateBox } from "@/shared/crypto/asymmetric";

type BoxInstance = ReturnType<typeof CreateBox>;

let box: BoxInstance | null = null;

function getBox(): BoxInstance {
  return (box ??= createBox(SERVER_SECRET_KEY, CLIENT_PUBLIC_KEY));
}

/**
 * 解密请求体中的 encrypted 字段（同步）
 *
 * 若 body 包含 encrypted 字段，解密并返回内层数据；否则原样返回。
 * 解密失败或 JSON 解析失败均抛出错误，由 Route Handler 统一 catch 处理。
 */
export function decryptRequestBody(body: Record<string, unknown> | null): Record<string, unknown> {
  if (body && typeof body === "object" && "encrypted" in body && typeof body.encrypted === "string") {
    const plaintext = getBox().decrypt(body.encrypted);
    return JSON.parse(plaintext) as Record<string, unknown>;
  }
  return (body ?? {}) as Record<string, unknown>;
}

/**
 * 加密响应体为 base64 密文（同步）
 *
 * 使用服务端私钥 + 客户端公钥进行 NaCl box 加密。
 */
export function encryptResponseBody(data: Record<string, unknown>): string {
  return getBox().encrypt(JSON.stringify(data));
}
