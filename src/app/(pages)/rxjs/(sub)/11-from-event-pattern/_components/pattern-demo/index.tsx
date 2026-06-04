"use client";

import { useUnmount } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { fromEventPattern, Subscription } from "rxjs";

import styles from "./styles.module.scss";

type LogEntry = { type: "val" | "note" };

/**
 * 4.3.5 fromEventPattern 交互演示
 *
 * 模拟自定义事件源，演示 addHandler/removeHandler 模式。
 * fromEventPattern 将任意事件源包装为 Observable。
 */
export default function PatternDemo() {
  const [subscribed, setSubscribed] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const subRef = useRef<Subscription | null>(null);
  const handlerRef = useRef<((v: unknown) => void) | null>(null);

  // 模拟自定义数据源：用 requestAnimationFrame 定时产生 mock 数据
  const timerRef = useRef<number>(0);

  const addHandler = useCallback((handler: (v: unknown) => void) => {
    handlerRef.current = handler;
    // 注册一个模拟的数据源
    setLogs((prev) => [...prev, { type: "note" }]);
    return undefined as unknown as () => void;
  }, []);

  const removeHandler = useCallback((_handler: (v: unknown) => void, _signal?: unknown) => {
    handlerRef.current = null;
    cancelAnimationFrame(timerRef.current);
    setLogs((prev) => [...prev, { type: "note" }]);
  }, []);

  const handleSubscribe = useCallback(() => {
    setLogs([]);
    setSubscribed(true);

    const source$ = fromEventPattern<string>(addHandler, removeHandler);

    subRef.current = source$.subscribe({
      next: (_val) => setLogs((prev) => [...prev, { type: "val" }]),
    });

    // 添加 handler 后立即写一条日志
    setLogs((prev) => [...prev, { type: "note" }]);
  }, [addHandler, removeHandler]);

  const handleEmit = useCallback(() => {
    if (handlerRef.current) {
      const val = `msg-${Date.now().toString().slice(-4)}`;
      handlerRef.current(val);
      setLogs((prev) => [...prev, { type: "val" }]);
    }
  }, []);

  const handleUnsubscribe = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setSubscribed(false);
  }, []);

  useUnmount(() => {
    subRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={styles.controls}>
        {!subscribed ? (
          <button className={styles.emitBtn} onClick={handleSubscribe}>
            订阅 fromEventPattern
          </button>
        ) : (
          <>
            <button className={styles.emitBtn} onClick={handleEmit}>
              发送数据
            </button>
            <button className={styles.unsubBtn} onClick={handleUnsubscribe}>
              取消订阅
            </button>
          </>
        )}
      </div>

      {subscribed && <span className={styles.status}>已订阅 — 点击 &ldquo;发送数据&rdquo; 模拟外部事件源发送数据</span>}

      <div className={styles.logArea}>
        {logs.length === 0 ? (
          <span className={styles.logEmpty}>{"// 点击\u201C订阅\u201D开始"}</span>
        ) : (
          logs.map((entry, i) =>
            entry.type === "val" ? (
              <div key={i} className={styles.logVal}>
                next: 收到数据
              </div>
            ) : (
              <div key={i} className={styles.logNote}>
                {"// handler 绑定/解绑"}
              </div>
            ),
          )
        )}
      </div>

      <p className={styles.info}>
        <code>fromEventPattern(addHandler, removeHandler)</code> 将任意事件源包装为 Observable。
        <br />
        订阅时调用 addHandler，退订时调用 removeHandler。
      </p>
    </section>
  );
}
