"use client";

import { createContext } from "react";

import type { ServiceRegistry } from "../core";

/**
 * 统一的 ServiceRegistry Context
 *
 * 使用同一个 Context 承载所有层级的 ServiceRegistry，
 * 父子关系通过 ServiceRegistry.parent 链自动维护。
 */
export const ServiceRegistryContext = createContext<ServiceRegistry | null>(null);
