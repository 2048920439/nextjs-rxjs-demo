/**
 * 客户端加解密单例（NaCl box）
 *
 * 双向通信：加密请求 payload + 解密服务端响应。
 * 延迟初始化：首次调用时创建 box 实例，后续复用。
 */

import { CLIENT_SECRET_KEY, SERVER_PUBLIC_KEY } from "@/config/crypto-client";
import { createBox } from "@/shared/crypto";
import type { createBox as CreateBox } from "@/shared/crypto/asymmetric";

type BoxInstance = ReturnType<typeof CreateBox>;

let box: BoxInstance | null = null;

function getBox(): BoxInstance {
  return (box ??= createBox(CLIENT_SECRET_KEY, SERVER_PUBLIC_KEY));
}

/**
 * 加密 payload 对象为 base64 密文（同步）
 *
 * 使用客户端私钥 + 服务端公钥进行 NaCl box 加密。
 */
export function encryptPayload(data: Record<string, string>): string {
  return getBox().encrypt(JSON.stringify(data));
}

/**
 * 解密服务端响应中的 encrypted 字段（同步）
 *
 * 使用客户端私钥 + 服务端公钥进行 NaCl box 解密。
 * 解密失败或 JSON 解析失败均抛出错误，由上层业务处理。
 */
export function decryptResponseBody(encrypted: string): Record<string, unknown> {
  const plaintext = getBox().decrypt(encrypted);
  return JSON.parse(plaintext) as Record<string, unknown>;
}
