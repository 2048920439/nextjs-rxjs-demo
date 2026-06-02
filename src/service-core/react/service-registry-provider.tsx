"use client";

import { useIsomorphicLayoutEffect } from "ahooks";
import type { PropsWithChildren, ReactNode } from "react";
import { useContext, useEffect, useState } from "react";

import { ServiceRegistry } from "../core";
import { ServiceRegistryContext } from "./service-registry-context";

export interface ServiceRegistryProviderProps extends PropsWithChildren {
  /**
   * 注册 Service
   * - registry：当前层新建的 ServiceRegistry（已绑定 parent）
   * - parent：父级 ServiceRegistry，顶层为 null
   */
  factory: (registry: ServiceRegistry, parent: ServiceRegistry | null) => void;
  children: ReactNode;
}

/**
 * 统一的 Service 注册 Provider
 *
 * - 顶层使用时外层无父 Context，自动作为根 registry
 * - 嵌套使用时自动从外层 Context 读取父 registry，形成父子链
 * - 子层 register 同 token 时会自动跳过，保持父层单例
 */
export function ServiceRegistryProvider({ factory, children }: ServiceRegistryProviderProps) {
  const parent = useContext(ServiceRegistryContext);

  const [registry] = useState<ServiceRegistry>(() => {
    const r = new ServiceRegistry(parent);
    factory(r, parent);
    return r;
  });

  // 水合：同步恢复持久化数据，触发 onHydrate 回调
  useIsomorphicLayoutEffect(() => {
    registry.forEach((s) => s._hydrate());
  }, [registry]);

  // 挂载 / 卸载生命周期
  useEffect(() => {
    registry.forEach((s) => s._mount());
    return () => {
      registry.forEach((s) => s._unmount());
    };
  }, [registry]);

  return <ServiceRegistryContext.Provider value={registry}>{children}</ServiceRegistryContext.Provider>;
}
