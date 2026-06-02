"use client";

import { PropsWithChildren } from "react";

import { CounterService } from "@/service/counter.service";
import { ServiceRegistryProvider } from "@/service-core/react";

export const Provider = ({ children }: PropsWithChildren) => {
  return (
    <ServiceRegistryProvider
      factory={(registry) => {
        registry.register(CounterService, () => new CounterService());
      }}
    >
      {children}
    </ServiceRegistryProvider>
  );
};
