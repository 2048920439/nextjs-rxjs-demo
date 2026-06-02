"use client";

import { useContext } from "react";

import type { BaseService } from "../core";
import type { InjectionToken } from "../core";
import { ServiceRegistryContext } from "./service-registry-context";

type Constructor<T = BaseService> = abstract new (...args: never[]) => T;

// 重载：InjectionToken 版本
export function useService<T>(token: InjectionToken<T>): T;
// 重载：class 构造函数版本
export function useService<T extends BaseService>(token: Constructor<T>): T;
// 实现
export function useService<T>(token: InjectionToken<T> | Constructor<T>): T {
  const registry = useContext(ServiceRegistryContext);
  if (!registry) {
    const name = typeof token === "function" ? (token as Constructor).name : String(token);
    throw new Error(`[useService] No ServiceRegistryProvider found for "${name}".`);
  }
  // registry.resolve 自动沿 parent 链回溯
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return registry.resolve<T>(token as any);
}
