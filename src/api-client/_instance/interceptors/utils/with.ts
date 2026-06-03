import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import { InterceptorDef, NoExtConfig } from "./types";

// ---- AxiosClient 类型 ----

type AxiosClientMethod<TExt> = {
  post: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  get: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  delete: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  head: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  options: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  put: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  patch: <T = unknown, R = AxiosResponse<T>, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D> & TExt) => Promise<R>;
  request: <T = unknown, R = AxiosResponse<T>, D = unknown>(config: AxiosRequestConfig<D> & TExt) => Promise<R>;
  getUri: (config?: AxiosRequestConfig & TExt) => string;
};

/**
 * 带扩展配置类型的 Axios 客户端
 *
 * - `TExt` 为请求配置扩展字段（如 `CryptoRequestConfig`）
 * - 业务层可直接传入扩展字段，无需类型断言
 */
export type AxiosClient<TExt = NoExtConfig> = Omit<AxiosInstance, keyof AxiosClientMethod<TExt>> & AxiosClientMethod<TExt>;

// ---- defineInterceptor（公开） ----

/**
 * 定义拦截器 —— 类型安全的工厂函数
 *
 * 泛型 TExt 告知该拦截器会对 AxiosRequestConfig 做哪些扩展，
 * 请求拦截器的 config 参数自动获得对应类型，无需手动类型断言。
 *
 * @example
 * const crypto = defineInterceptor<CryptoRequestConfig>({
 *   name: "crypto",
 *   request: {
 *     onFulfilled(config) {
 *       config.encrypt; // ✅ 类型安全，无需 as
 *       return config;
 *     },
 *   },
 * });
 */
export function defineInterceptor<TExt = NoExtConfig>(def: InterceptorDef<TExt>): InterceptorDef<TExt> {
  return def;
}

// ---- _withInterceptor（私有 / 类型模糊层） ----

/**
 * 向 axios 实例注入单个拦截器定义
 *
 * 通过 `InterceptorDef`（无泛型）作为类型模糊层，
 * 抹平 `RequestInterceptorDef<TExt>` 与 axios 原生拦截器签名的差异。
 */
function _withInterceptor(instance: AxiosInstance, def: InterceptorDef): AxiosInstance {
  if (def.request) {
    instance.interceptors.request.use(def.request.onFulfilled, def.request.onRejected);
  }
  if (def.response) {
    instance.interceptors.response.use(def.response.onFulfilled, def.response.onRejected);
  }
  return instance;
}

// ---- withInterceptors（公开） ----

/**
 * 向 axios 实例批量注入多个拦截器定义
 *
 * 通过显式泛型 `T` 指定统一的请求配置扩展类型，
 * 客户端方法签名自动获得对应字段：
 * ```
 * const client = withInterceptors<CryptoRequestConfig>(
 *   axios.create(),
 *   [cryptoInterceptor, errorInterceptor],
 * );
 * // client.post(url, data, { encrypt: false })  ← 类型安全
 * ```
 */
export function withInterceptors<T extends object = NoExtConfig>(instance: AxiosInstance, defs: InterceptorDef<T>[]): AxiosClient<T> {
  for (const def of defs) {
    _withInterceptor(instance, def as unknown as InterceptorDef);
  }
  return instance as AxiosClient<T>;
}
