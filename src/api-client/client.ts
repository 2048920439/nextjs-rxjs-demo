import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

/**
 * Shared axios instance with auth interceptors.
 * JWT is stored in httpOnly cookie — the browser sends it automatically
 * for same-origin requests. No manual Authorization header needed for now.
 */

const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // ensure cookies are always sent (cross-origin safety)
});

// ---- Request interceptor ----
// Hook point: if switching to Bearer token auth, read token from
// localStorage / cookie and attach here.

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- Response interceptor ----
// Unwrap backend JSON error messages into a throwable string.

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error ?? error.message;
    return Promise.reject(new Error(message));
  },
);

export { apiClient };
