"use client";

import clsx from "clsx";

import { CounterService } from "@/service/counter.service";
import { useService } from "@/service-core/react";

import styles from "./counter-control.module.scss";

export function CounterControl() {
  const counter = useService(CounterService);

  return (
    <div className={clsx(styles.panel, "p-5", "text-center")}>
      <h3 className="m-0 mb-3">🎮 CounterControl</h3>
      <div className="flex justify-center gap-3">
        <button className={clsx(styles.btn, "cursor-pointer px-5 py-2 text-base")} onClick={() => counter.decrement()}>
          −1
        </button>
        <button className={clsx(styles.btnPrimary, "cursor-pointer px-5 py-2 text-base")} onClick={() => counter.increment()}>
          +1
        </button>
        <button className={clsx(styles.btnDanger, "cursor-pointer px-5 py-2 text-base")} onClick={() => counter.reset()}>
          Reset
        </button>
      </div>
      <p className="mt-2 m-0 text-gray-500">调用 service 方法，同一实例实现跨组件通信</p>
    </div>
  );
}
