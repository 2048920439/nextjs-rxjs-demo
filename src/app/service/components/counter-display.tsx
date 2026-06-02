"use client";

import clsx from "clsx";

import { CounterService } from "@/service/counter.service";
import { useObservableState, useService } from "@/service-core/react";

import styles from "./counter-display.module.scss";

export function CounterDisplay() {
  const counter = useService(CounterService);
  const count = useObservableState(counter.count$, () => counter.count);

  return (
    <div className={clsx(styles.panel, "p-5", "text-center")}>
      <h3 className="m-0 mb-3">📊 CounterDisplay</h3>
      <p className="my-2 text-5xl font-bold">{count}</p>
      <p className="m-0 text-gray-500">通过 useService + useObservableState 响应式订阅</p>
    </div>
  );
}
