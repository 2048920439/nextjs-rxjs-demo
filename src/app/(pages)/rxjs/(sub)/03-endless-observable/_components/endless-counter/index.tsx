"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { Observable, Subscription } from "rxjs";

import styles from "./styles.module.scss";

/** 最多保留的历史记录条数 */
const HISTORY_LIMIT = 10;

/** 历史记录项：value 为吐出的数值，error 标识是否因 error 终止 */
interface HistoryItem {
  value: number;
  error: boolean;
}

/**
 * 2.2.5 永无止境的 Observable 交互演示
 *
 * 与书中代码一致：手动 new Observable(onSubscribe)，
 * 每秒 observer.next(number++)；当 number 为 7 的倍数时触发 observer.error()。
 */
export default function EndlessCounter() {
  const [subscribed, setSubscribed] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const subscriptionRef = useRef<Subscription | null>(null);

  const handleSubscribe = useCallback(() => {
    setCount(0);
    setError(false);
    setHistory([]);
    setElapsed(0);
    setSubscribed(true);

    // 手动构造 Observable，与书中 onSubscribe 模式一致：
    //   每秒递增 number，若为 7 的倍数则调用 subscriber.error() 终止数据流。
    const source$ = new Observable<number>((subscriber) => {
      let number = 1;
      const handle = setInterval(() => {
        if (number % 7 === 0) {
          subscriber.error(new Error(`遇到 7 的倍数: ${number}`));
          clearInterval(handle);
          return;
        }
        subscriber.next(number++);
      }, 1000);

      return () => clearInterval(handle);
    });

    subscriptionRef.current = source$.subscribe({
      next: (value) => {
        setCount(value);
        setElapsed(value);
        setHistory((prev) => {
          const next = [...prev, { value, error: false }];
          return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
        });
      },
      error: (err) => {
        const errValue = Number((err as Error).message.match(/\d+/)?.[0]) || 0;
        setCount(errValue);
        setError(true);
        setSubscribed(false);
        setHistory((prev) => {
          const next = [...prev, { value: errValue, error: true }];
          return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
        });
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

  const hasError = error;
  const isActive = subscribed;
  const isStopped = !subscribed && history.length > 0;

  return (
    <section className={styles.demo}>
      {/* 左侧：发布者 */}
      <div className={styles.publisher}>
        <h3 className={styles.roleTitle}>发布者（Observable）</h3>
        <div className={styles.sourceBox}>
          <code>new Observable(observer =&gt; &#123;…&#125;)</code>
        </div>
        <p className={styles.roleNote}>
          每秒 <code>observer.next(number++)</code>；7 的倍数触发 <code>observer.error()</code>
        </p>

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

      {/* 数据流连接线 */}
      <div className={styles.connector}>
        <div
          className={clsx(styles.pipe, {
            [styles.pipeActive]: isActive,
            [styles.pipeError]: hasError,
          })}
        >
          {isActive && (
            <>
              <span className={clsx(styles.dot, styles.dot1)} />
              <span className={clsx(styles.dot, styles.dot2)} />
              <span className={clsx(styles.dot, styles.dot3)} />
            </>
          )}
        </div>
        <span className={clsx(styles.arrow, hasError && styles.arrowError)}>{isActive ? "↓↓↓" : hasError ? "✕✕✕" : "———"}</span>
      </div>

      {/* 右侧：观察者 */}
      <div className={styles.observer}>
        <h3 className={styles.roleTitle}>观察者（Observer）</h3>

        {/* 核心计数器 */}
        <div
          className={clsx(styles.counterWrap, {
            [styles.counterActive]: isActive,
            [styles.counterError]: hasError,
          })}
        >
          <span className={styles.counterLabel}>当前值</span>
          <span key={count} className={clsx(styles.counterValue, hasError && styles.counterValueError)}>
            {count || "—"}
          </span>
          {isActive && <span className={styles.counterTick}>·</span>}
          {hasError && <span className={styles.errorBadge}>ERROR</span>}
        </div>

        {/* 运行状态 */}
        <div className={styles.statusBar}>
          <span>
            已运行 <strong>{elapsed}</strong> 秒
          </span>
          <span>
            {isActive ? (
              <span className={styles.statusRunning}>● 数据流进行中</span>
            ) : hasError ? (
              <span className={styles.statusError}>✕ 发生错误，流已终止</span>
            ) : (
              <span className={styles.statusIdle}>○ 等待订阅</span>
            )}
          </span>
          {isStopped && !hasError && <span className={styles.statusStopped}>◉ 已取消</span>}
        </div>

        {/* 历史记录 */}
        <div className={styles.historyArea}>
          <p className={styles.historyTitle}>吐出历史（最近 {HISTORY_LIMIT} 条）</p>
          <div className={styles.historyTrack}>
            {history.length === 0 ? (
              <span className={styles.historyEmpty}>—</span>
            ) : (
              history.map((item, i) => (
                <span
                  key={i}
                  className={clsx(styles.historyDot, {
                    [styles.historyDotLatest]: i === history.length - 1,
                    [styles.historyDotError]: item.error,
                  })}
                >
                  {item.value}
                  {item.error && " ✕"}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
