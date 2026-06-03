import { defineInterceptor } from "./utils/with";

/**
 * 错误处理拦截器
 *
 * 响应：将 Axios 错误的 JSON error 字段提取为 throwable Error；
 * 非 Axios 错误（如上游拦截器抛出的加解密异常）原样透传，保留原始堆栈。
 * 请求：留空，暂无特殊处理
 */
export const errorInterceptor = defineInterceptor({
  response: {
    onRejected(error: unknown) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.error ?? error.message;
        return Promise.reject(new Error(message, { cause: error }));
      }
      return Promise.reject(error);
    },
  },
});

function isAxiosError(error: unknown): error is import("axios").AxiosError<{ error?: string }> {
  return typeof error === "object" && error !== null && "isAxiosError" in error && (error as Record<string, unknown>).isAxiosError === true;
}
