"use client";

import type { PropsWithChildren } from "react";

import { AuthService } from "@/service/auth";
import { ServiceRegistryProvider } from "@/service-core";
import type { User } from "@/shared/types/auth";

export interface BasicServiceProviderProps extends PropsWithChildren {
  initUser: User | null | undefined;
}
/**
 * 全局客户端服务注入 Provider
 * 在此注册所有页面层级共用的 Service（如 AuthService 等）
 */
export function BasicServiceProvider({ children, initUser }: BasicServiceProviderProps) {
  return (
    <ServiceRegistryProvider
      factory={(registry) => {
        registry.register(AuthService, () => new AuthService(initUser));
      }}
    >
      {children}
    </ServiceRegistryProvider>
  );
}
