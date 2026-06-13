"use client";

import { useUnmount } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { fromEvent, map, merge, scan, startWith, Subject, Subscription } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 4.3.4 fromEvent 交互演示
 *
 * 用 fromEvent 把按钮点击变成 Observable，
 * 再用 scan 负责累计和重置，让 RxJS 承担主要的数据处理逻辑。
 */
export default function ClickCounter() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const subRef = useRef<Subscription | null>(null);
  const resetRef = useRef(new Subject<void>());
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    const click$ = fromEvent(el, "click").pipe(map(() => ({ type: "inc" as const })));
    const reset$ = resetRef.current.pipe(map(() => ({ type: "reset" as const })));

    subRef.current = merge(click$, reset$)
      .pipe(
        scan((total, event) => (event.type === "reset" ? 0 : total + 1), 0),
        startWith(0),
      )
      .subscribe((nextCount) => {
        setCount(nextCount);
      });

    return () => {
      subRef.current?.unsubscribe();
    };
  }, []);

  const handleReset = useCallback(() => {
    resetRef.current.next();
  }, []);

  useUnmount(() => {
    subRef.current?.unsubscribe();
    resetRef.current.complete();
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
          <span className={styles.statValue}>{count > 0 ? "●" : "○"}</span>
        </div>
      </div>

      <p className={styles.flowInfo}>
        <code>fromEvent(btn, &apos;click&apos;)</code> 产生 <strong>Hot Observable</strong>。
        <br />
        点击和重置都进入同一条流，由 <code>scan</code> 计算当前次数。
      </p>

      {count > 0 && (
        <button className={styles.resetBtn} onClick={handleReset}>
          重置
        </button>
      )}
    </section>
  );
}
