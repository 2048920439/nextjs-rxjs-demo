"use client";

import { PropsWithChildren } from "react";

import { ServiceRegistryProvider } from "@/service-core";

import { NumberOrchestrationService } from "../../_service/number-orchestration.service";

/**
 * 页面私有 Service 注入 Provider
 * 在此注册仅本页面使用的 Service，避免污染全局 BasicServiceProvider
 */
export function ServiceProvider({ children }: PropsWithChildren) {
  return (
    <ServiceRegistryProvider
      factory={(registry) => {
        registry.register(NumberOrchestrationService, () => new NumberOrchestrationService());
      }}
    >
      {children}
    </ServiceRegistryProvider>
  );
}
