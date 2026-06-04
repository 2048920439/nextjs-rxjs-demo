"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { interval, Subscription, timer } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 4.3.1 interval 和 timer 交互演示
 *
 * 两张卡片：interval 每秒递增；timer 延迟后触发单次或周期。
 */
export default function TimingDemo() {
  // interval
  const [intervalCount, setIntervalCount] = useState(0);
  const [intervalRunning, setIntervalRunning] = useState(false);
  const intervalSubRef = useRef<Subscription | null>(null);

  const startInterval = useCallback(() => {
    setIntervalCount(0);
    setIntervalRunning(true);
    intervalSubRef.current = interval(1000).subscribe({
      next: (val) => setIntervalCount(val + 1),
    });
  }, []);

  const stopInterval = useCallback(() => {
    intervalSubRef.current?.unsubscribe();
    intervalSubRef.current = null;
    setIntervalRunning(false);
  }, []);

  // timer
  const [timerDelay, setTimerDelay] = useState(2000);
  const [timerCount, setTimerCount] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerSubRef = useRef<Subscription | null>(null);

  const startTimer = useCallback(() => {
    setTimerCount(null);
    setTimerRunning(true);
    // timer(delay, period) — delay 后触发，之后每 period 周期触发
    timerSubRef.current = timer(timerDelay, 1000).subscribe({
      next: (val) => setTimerCount(val + 1),
    });
  }, [timerDelay]);

  const stopTimer = useCallback(() => {
    timerSubRef.current?.unsubscribe();
    timerSubRef.current = null;
    setTimerRunning(false);
  }, []);

  useUnmount(() => {
    intervalSubRef.current?.unsubscribe();
    timerSubRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      {/* interval */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>interval(1000)</h3>
        <p className={styles.cardDesc}>
          每隔 1000ms 吐出递增整数
          <br />
          （0, 1, 2, 3, … 永不完结）
        </p>
        <div className={clsx(styles.counter, !intervalRunning && styles.counterIdle)}>{intervalRunning ? intervalCount : "—"}</div>
        <div className={styles.controls}>
          {intervalRunning ? (
            <button className={styles.stopBtn} onClick={stopInterval}>
              停止
            </button>
          ) : (
            <button className={styles.startBtn} onClick={startInterval}>
              启动
            </button>
          )}
        </div>
      </div>

      {/* timer */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>timer(delay, period)</h3>
        <p className={styles.cardDesc}>
          延迟后触发，之后每 1000ms 周期
          <br />
          （类似 setTimeout + setInterval）
        </p>
        <div className={styles.controls}>
          <span className={styles.delayLabel}>初始延迟(ms):</span>
          <input
            type="number"
            className={styles.delayInput}
            value={timerDelay}
            min={500}
            step={500}
            onChange={(e) => setTimerDelay(Number(e.target.value) || 2000)}
            disabled={timerRunning}
          />
        </div>
        <div className={clsx(styles.counter, !timerRunning && styles.counterIdle)}>{timerRunning ? (timerCount ?? "等待中…") : "—"}</div>
        <div className={styles.controls}>
          {timerRunning ? (
            <button className={styles.stopBtn} onClick={stopTimer}>
              停止
            </button>
          ) : (
            <button className={styles.timerStartBtn} onClick={startTimer}>
              启动
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
