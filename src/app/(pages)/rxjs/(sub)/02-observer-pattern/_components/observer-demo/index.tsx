"use client";

import { useCallback, useRef, useState } from "react";
import { concatMap, map, of, Subscription, timer } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 2.2.1 观察者模式交互演示
 *
 * 可视化展示 Observable（发布者）与 Observer（观察者）的关系：
 *   1. 点击"订阅"按钮建立连接
 *   2. Observable.of(1, 2, 3) 同步依次发出三个值
 *   3. Observer 接收并展示每个值
 *   4. 可随时取消订阅
 */
export default function ObserverDemo() {
  const [subscribed, setSubscribed] = useState(false);
  const [records, setRecords] = useState<number[]>([]);
  const subscriptionRef = useRef<Subscription | null>(null);

  const handleSubscribe = useCallback(() => {
    setRecords([]);
    setSubscribed(true);

    // of(1, 2, 3) 本身是同步发射的，三个值在同一个 microtask 内全部发出，
    // React 会将其批处理为一次渲染，导致 UI 中三个值几乎同时出现。
    // 为便于在 UI 中逐帧观察，通过 concatMap + timer 在值之间引入间隔：
    //   - concatMap 保证前一个值处理完毕（timer 完成）后才处理下一个
    //   - timer(600) 每个值延迟 600ms 发出，让 Observer 逐个接收
    subscriptionRef.current = of(1, 2, 3)
      .pipe(concatMap((value) => timer(600).pipe(map(() => value))))
      .subscribe({
        next: (value) => {
          setRecords((prev) => [...prev, value]);
        },
        complete: () => {
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

  return (
    <section className={styles.demo}>
      {/* 发布者区域 */}
      <div className={styles.publisher}>
        <h3 className={styles.roleTitle}>发布者（Observable）</h3>
        <div className={styles.sourceBox}>
          <code>Observable.of(1, 2, 3)</code>
        </div>
        <p className={styles.roleNote}>负责产生事件数据，不关心谁在监听</p>

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

      {/* 数据流连接线 */}
      <div className={styles.connector}>
        <div className={`${styles.pipe} ${subscribed ? styles.pipeActive : ""}`} />
        <span className={styles.arrow}>{subscribed ? "→→→" : "———"}</span>
      </div>

      {/* 观察者区域 */}
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
        </div>
      </div>
    </section>
  );
}
