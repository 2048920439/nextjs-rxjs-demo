"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { Observable, Subscription } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 2.2.5 永无止境的 Observable 交互演示
 *
 * 这个示例只保留“无限流 + 手动取消订阅”两个核心点，
 * 让读者直观看到 Observable 可以持续发出数据，但不会自己结束。
 */
export default function EndlessCounter() {
  const [subscribed, setSubscribed] = useState(false);
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const subscriptionRef = useRef<Subscription | null>(null);

  const handleSubscribe = useCallback(() => {
    setCount(0);
    setHistory([]);
    setSubscribed(true);

    const source$ = new Observable<number>((subscriber) => {
      let number = 1;
      const handle = setInterval(() => {
        subscriber.next(number++);
      }, 1000);

      return () => clearInterval(handle);
    });

    subscriptionRef.current = source$.subscribe({
      next: (value) => {
        setCount(value);
        setHistory((prev) => {
          const next = [...prev, value];
          return next.length > 8 ? next.slice(-8) : next;
        });
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
          <code>new Observable(observer =&gt; &#123; setInterval(...) &#125;)</code>
        </div>
        <p className={styles.roleNote}>持续发出数据，不会主动 complete</p>

        <div className={styles.infinityBadge}>∞</div>

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

      <div className={clsx(styles.pipe, subscribed && styles.pipeActive)} />

      <div className={styles.observer}>
        <h3 className={styles.roleTitle}>观察者（Observer）</h3>
        <div className={styles.counterWrap}>
          <span className={styles.counterLabel}>当前值</span>
          <span className={styles.counterValue}>{count || "—"}</span>
        </div>

        <div className={styles.historyArea}>
          <p className={styles.historyTitle}>最近输出</p>
          <div className={styles.historyTrack}>
            {history.length === 0 ? (
              <span className={styles.historyEmpty}>等待订阅...</span>
            ) : (
              history.map((item, i) => (
                <span key={i} className={clsx(styles.historyDot, i === history.length - 1 && styles.historyDotLatest)}>
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
