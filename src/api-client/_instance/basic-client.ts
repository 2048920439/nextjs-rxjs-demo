import axios from "axios";

import type { CryptoRequestConfig } from "./interceptors";
import { cryptoInterceptor, errorInterceptor, withInterceptors } from "./interceptors";

/**
 * 默认 apiClient 实例
 */
export const basicClient = withInterceptors<CryptoRequestConfig>(
  axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // ensure cookies are always sent (cross-origin safety)
  }),
  [cryptoInterceptor, errorInterceptor],
);
