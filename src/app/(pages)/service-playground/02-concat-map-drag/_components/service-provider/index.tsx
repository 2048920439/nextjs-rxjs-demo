"use client";

import { type PropsWithChildren } from "react";

import { ServiceRegistryProvider } from "@/service-core";

import { ConcatMapDragService } from "../../_service/concat-map-drag.service";

export function ServiceProvider({ children }: PropsWithChildren) {
  return (
    <ServiceRegistryProvider
      factory={(registry) => {
        registry.register(ConcatMapDragService, () => new ConcatMapDragService());
      }}
    >
      {children}
    </ServiceRegistryProvider>
  );
}
