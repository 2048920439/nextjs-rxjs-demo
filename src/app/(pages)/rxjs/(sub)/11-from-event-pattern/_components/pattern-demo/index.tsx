"use client";

import { useUnmount } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { fromEventPattern, Subscription } from "rxjs";

import styles from "./styles.module.scss";

type LogEntry = { type: "val" | "note"; text: string };

/**
 * 4.3.5 fromEventPattern 交互演示
 *
 * 用一个最小事件总线来演示 addHandler / removeHandler 的作用：
 * 订阅时注册回调，退订时移除回调，emit 时触发所有回调。
 */
export default function PatternDemo() {
  const [subscribed, setSubscribed] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const subRef = useRef<Subscription | null>(null);
  const listenersRef = useRef(new Set<(value: string) => void>());

  const addHandler = useCallback((handler: (value: string) => void) => {
    listenersRef.current.add(handler);
    setLogs((prev) => [...prev, { type: "note", text: "addHandler" }]);
  }, []);

  const removeHandler = useCallback((handler: (value: string) => void) => {
    listenersRef.current.delete(handler);
    setLogs((prev) => [...prev, { type: "note", text: "removeHandler" }]);
  }, []);

  const handleSubscribe = useCallback(() => {
    setLogs([]);
    setSubscribed(true);

    const source$ = fromEventPattern<string>(addHandler, removeHandler);
    subRef.current = source$.subscribe({
      next: (value) => {
        setLogs((prev) => [...prev, { type: "val", text: `next: ${value}` }]);
      },
    });
  }, [addHandler, removeHandler]);

  const handleEmit = useCallback(() => {
    const value = `msg-${Date.now().toString().slice(-4)}`;
    listenersRef.current.forEach((listener) => listener(value));
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

      {subscribed && <span className={styles.status}>已订阅：点击“发送数据”会触发 addHandler 注册的回调</span>}

      <div className={styles.logArea}>
        {logs.length === 0 ? (
          <span className={styles.logEmpty}>点击“订阅”开始</span>
        ) : (
          logs.map((entry, i) =>
            entry.type === "val" ? (
              <div key={i} className={styles.logVal}>
                {entry.text}
              </div>
            ) : (
              <div key={i} className={styles.logNote}>{`// ${entry.text}`}</div>
            ),
          )
        )}
      </div>

      <p className={styles.info}>
        <code>fromEventPattern(addHandler, removeHandler)</code> 把任意事件源包装成 Observable。
        <br />
        订阅时调用 addHandler，退订时调用 removeHandler。
      </p>
    </section>
  );
}
