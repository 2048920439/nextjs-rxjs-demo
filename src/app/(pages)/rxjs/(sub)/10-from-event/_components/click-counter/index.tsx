"use client";

import { useUnmount } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { fromEvent, Subscription } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 4.3.4 fromEvent 交互演示
 *
 * 将 DOM 按钮的 click 事件转化为 Observable 流，展示 Hot Observable 的特征。
 */
export default function ClickCounter() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const subRef = useRef<Subscription | null>(null);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    const click$ = fromEvent(el, "click");
    // fromEvent 产生 Hot Observable：数据源在 RxJS 之外，订阅前的事件已丢失

    subRef.current = click$.subscribe(() => {
      setCount((c) => c + 1);
      setActive(true);
    });

    return () => {
      subRef.current?.unsubscribe();
    };
  }, []);

  const handleReset = useCallback(() => {
    setCount(0);
    setActive(false);
  }, []);

  useUnmount(() => {
    subRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <button ref={btnRef} className={styles.clickBtn}>
        点我（Click Me）
      </button>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>点击次数</span>
          <span className={styles.statValue}>{count}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>流状态</span>
          <span className={styles.statValue}>{active ? "●" : "○"}</span>
        </div>
      </div>

      <p className={styles.flowInfo}>
        <code>fromEvent(btn, &apos;click&apos;)</code> 产生 <strong>Hot Observable</strong>：<br />
        数据源（按钮点击）在 RxJS 外部，与订阅时机无关；后来 subscribe 的 Observer 只能看到之后的点击。
      </p>

      {count > 0 && (
        <button className={styles.resetBtn} onClick={handleReset}>
          重置
        </button>
      )}
    </section>
  );
}
