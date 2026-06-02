"use client";

import type { PropsWithChildren } from "react";

import { AuthService, type AuthState } from "@/service/auth.service";
import { ServiceRegistryProvider } from "@/service-core";

export interface BasicServiceProviderProps extends PropsWithChildren {
  authState: AuthState;
}
/**
 * 全局客户端服务注入 Provider
 * 在此注册所有页面层级共用的 Service（如 AuthService 等）
 */
export function BasicServiceProvider({ children, authState }: BasicServiceProviderProps) {
  return (
    <ServiceRegistryProvider
      factory={(registry) => {
        registry.register(AuthService, () => new AuthService(authState));
      }}
    >
      {children}
    </ServiceRegistryProvider>
  );
}
