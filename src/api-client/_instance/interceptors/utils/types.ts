import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

/** 空扩展配置标记，用于交叉类型的恒等元（`NoExtConfig & T = T`） */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NoExtConfig {}

/**
 * 请求拦截器定义
 *
 * `config` 参数自动包含 `TExt` 扩展字段，拦截器内部可直接访问扩展属性，
 * 无需类型断言。
 */
export interface RequestInterceptorDef<TExt = NoExtConfig> {
  onFulfilled?: (config: InternalAxiosRequestConfig & TExt) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  onRejected?: (error: unknown) => unknown;
}

/** 响应拦截器定义 */
export interface ResponseInterceptorDef<TExt = NoExtConfig> {
  onFulfilled?: <T = unknown>(response: AxiosResponse<T> & { config: InternalAxiosRequestConfig & TExt }) => AxiosResponse<T> | Promise<AxiosResponse<T>>;
  onRejected?: (error: unknown) => unknown;
}

/**
 * 拦截器定义 —— `defineInterceptor` 的返回值
 *
 * 将关联的请求/响应拦截器封装为一个可组合单元。
 *
 * @typeParam TExt — 该拦截器对 AxiosRequestConfig 的扩展字段类型，
 *   通过 `withInterceptors` 的 variadic 推断自动合并到客户端方法签名中
 */
export interface InterceptorDef<TExt = NoExtConfig> {
  /** 请求拦截器（可选）—— config 参数携带 TExt 类型 */
  request?: RequestInterceptorDef<TExt>;
  /** 响应拦截器（可选）—— response.config 携带 TExt 类型 */
  response?: ResponseInterceptorDef<TExt>;
}
