"use client";

import { useUnmount } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { of, Subscription } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 2.2.1 观察者模式交互演示
 *
 * 尽量还原书中的结构：Observable 负责产生数据，Observer 负责接收数据。
 * 这里直接使用 of(1, 2, 3) 让读者看到 subscribe 后的同步输出顺序。
 */
export default function ObserverDemo() {
  const [subscribed, setSubscribed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [records, setRecords] = useState<number[]>([]);
  const subscriptionRef = useRef<Subscription | null>(null);

  const handleSubscribe = useCallback(() => {
    setRecords([]);
    setCompleted(false);
    setSubscribed(true);

    const values: number[] = [];
    subscriptionRef.current = of(1, 2, 3).subscribe({
      next: (value) => {
        values.push(value);
        setRecords([...values]);
      },
      complete: () => {
        setCompleted(true);
        setSubscribed(false);
        subscriptionRef.current = null;
      },
    });
  }, []);

  const handleUnsubscribe = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setSubscribed(false);
  }, []);

  useUnmount(() => {
    subscriptionRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={styles.publisher}>
        <h3 className={styles.roleTitle}>发布者（Observable）</h3>
        <div className={styles.sourceBox}>
          <code>of(1, 2, 3)</code>
        </div>
        <p className={styles.roleNote}>负责产生数据，不关心谁在监听</p>

        <div className={styles.emitQueue}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={`${styles.emitDot} ${records.includes(n) ? styles.dotEmitted : ""}`}>
              {n}
            </span>
          ))}
        </div>

        <div className={styles.actions}>
          {!subscribed ? (
            <button className={styles.subscribeBtn} onClick={handleSubscribe}>
              订阅（subscribe）
            </button>
          ) : (
            <button className={styles.unsubscribeBtn} onClick={handleUnsubscribe}>
              取消订阅（unsubscribe）
            </button>
          )}
        </div>
      </div>

      <div className={styles.connector}>
        <div className={`${styles.pipe} ${subscribed ? styles.pipeActive : ""}`} />
        <span className={styles.arrow}>{subscribed ? "→" : "—"}</span>
      </div>

      <div className={styles.observer}>
        <h3 className={styles.roleTitle}>观察者（Observer）</h3>
        <div className={styles.observerBox}>
          <code>console.log</code>
        </div>
        <p className={styles.roleNote}>只管接收并处理数据，不关心数据从哪来</p>

        <div className={styles.receiveArea}>
          {records.length === 0 && !subscribed ? (
            <p className={styles.placeholder}>等待订阅...</p>
          ) : (
            <ul className={styles.recordList}>
              {records.map((r, i) => (
                <li key={i} className={styles.recordItem}>
                  收到数据：<strong>{r}</strong>
                </li>
              ))}
            </ul>
          )}
          {completed && <p className={styles.placeholder}>complete</p>}
        </div>
      </div>
    </section>
  );
}
