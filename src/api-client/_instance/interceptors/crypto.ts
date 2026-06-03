/**
 * 客户端加解密单例（NaCl box）
 *
 * 双向通信：加密请求 payload + 解密服务端响应。
 * 延迟初始化：首次调用时创建 box 实例，后续复用。
 */
import { defineInterceptor } from "@/api-client/_instance/interceptors/utils/with";
import { CLIENT_SECRET_KEY, SERVER_PUBLIC_KEY } from "@/config/crypto-client";
import { createBox } from "@/shared/crypto";
import type { createBox as CreateBox } from "@/shared/crypto/asymmetric";

type BoxInstance = ReturnType<typeof CreateBox>;

let box: BoxInstance | null = null;

function getBox(): BoxInstance {
  return (box ??= createBox(CLIENT_SECRET_KEY, SERVER_PUBLIC_KEY));
}

function encryptPayload(data: unknown): string {
  return getBox().encrypt(JSON.stringify(data));
}

function decryptResponseBody(encrypted: string): Record<string, unknown> {
  const plaintext = getBox().decrypt(encrypted);
  return JSON.parse(plaintext) as Record<string, unknown>;
}

/** 请求级加解密标记，通过 axios config 透传 */
export interface CryptoRequestConfig {
  /** true 时自动加密请求体 + 解密响应体 */
  crypto?: boolean;
}

/**
 * 加解密拦截器
 */
export const cryptoInterceptor = defineInterceptor<CryptoRequestConfig>({
  request: {
    onFulfilled(config) {
      if (config.data && config.crypto) {
        config.data = { encrypted: encryptPayload(config.data) };
      }
      return config;
    },
  },

  response: {
    onFulfilled(response) {
      const shouldDecrypt = (response.config as CryptoRequestConfig).crypto;
      const data = response.data as { encrypted?: string } | undefined;
      if (shouldDecrypt && data?.encrypted) {
        response.data = decryptResponseBody(data.encrypted) as typeof response.data;
      }
      return response;
    },
  },
});
