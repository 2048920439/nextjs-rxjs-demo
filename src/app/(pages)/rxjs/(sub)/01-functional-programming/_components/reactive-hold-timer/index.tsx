"use client";

import { useEffect, useRef } from "react";
import { fromEvent } from "rxjs";
import { timestamp, withLatestFrom } from "rxjs/operators";

import styles from "./styles.module.scss";

/**
 * 响应式按住计时器 — 对应 RxJS 版本
 *
 * 将 mousedown/mouseup 视为数据流，通过 Operator 管道声明式变换：
 *   fromEvent → timestamp → withLatestFrom → 计算时长 → 更新 DOM
 *
 * 体现了"做什么（What）"的编程风格。
 */
export default function ReactiveHoldTimer() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const btn = btnRef.current!;
    const display = displayRef.current!;

    const mouseDown$ = fromEvent<MouseEvent>(btn, "mousedown");
    const mouseUp$ = fromEvent<MouseEvent>(btn, "mouseup");

    const sub = mouseUp$
      .pipe(
        timestamp(),
        withLatestFrom(mouseDown$.pipe(timestamp()), (up, down) => up.timestamp - down.timestamp),
      )
      .subscribe((ms) => {
        display.textContent = String(ms);
      });

    return () => sub.unsubscribe();
  }, []);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>响应式（Reactive）</h2>
      <button ref={btnRef} className={styles.holdBtn}>
        按住我，松手计时
      </button>
      <p className={styles.time}>
        按住时长：
        <span ref={displayRef} className={styles.value}>
          0
        </span>{" "}
        ms
      </p>
      <p className={styles.note}>
        事件经 <code>fromEvent</code> 转为 Observable，通过 <code>timestamp + withLatestFrom</code> 声明式计算时长
      </p>
    </section>
  );
}
