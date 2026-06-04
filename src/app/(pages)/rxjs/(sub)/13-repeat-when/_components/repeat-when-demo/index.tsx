"use client";

import { useUnmount } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { interval, Observable, repeatWhen, Subscription } from "rxjs";

import styles from "./styles.module.scss";

type LogEntry = { type: "sub" | "unsub" | "next" | "complete"; text: string };

/**
 * 4.3.7 repeatWhen 交互演示
 *
 * 用 notifier Observable 控制重新订阅的节奏（间隔 delayMs）。
 */
export default function RepeatWhenDemo() {
  const [delay, setDelay] = useState(2000);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const subRef = useRef<Subscription | null>(null);

  const addLog = useCallback((type: LogEntry["type"], text: string) => {
    setLogs((prev) => [...prev, { type, text }]);
  }, []);

  const handleStart = useCallback(() => {
    setLogs([]);
    setRound(0);
    setRunning(true);

    const source$ = new Observable<number>((subscriber) => {
      addLog("sub", "on subscribe");
      let n = 0;
      const h = setInterval(() => subscriber.next(++n), 500);
      setTimeout(() => {
        clearInterval(h);
        subscriber.complete();
      }, 1800);
      return () => {
        clearInterval(h);
        addLog("unsub", "on unsubscribe");
      };
    });

    const notifier = () => interval(delay);
    const repeated$ = source$.pipe(repeatWhen(notifier));

    let cr = 0;
    subRef.current = repeated$.subscribe({
      next: (val) => {
        if (val === 1) {
          cr++;
          setRound(cr);
        }
        addLog("next", `第 ${cr} 轮: ${val}`);
      },
      complete: () => {
        addLog("complete", "complete");
        setRunning(false);
      },
    });
  }, [delay, addLog]);

  const handleStop = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setRunning(false);
  }, []);

  useUnmount(() => {
    subRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={styles.controls}>
        <span className={styles.label}>重订阅间隔(ms):</span>
        <input
          type="number"
          className={styles.input}
          value={delay}
          min={500}
          step={500}
          onChange={(e) => setDelay(Number(e.target.value) || 2000)}
          disabled={running}
        />
        {running ? (
          <button className={styles.stopBtn} onClick={handleStop}>
            停止
          </button>
        ) : (
          <button className={styles.startBtn} onClick={handleStart}>
            开始
          </button>
        )}
      </div>

      {running && (
        <div className={styles.roundInfo}>
          当前轮次: {round}（每 {delay}ms 重新订阅一次）
        </div>
      )}

      <div className={styles.logArea}>
        {logs.length === 0 ? (
          <span className={styles.logEmpty}>{"// 点击\u201C开始\u201D查看 repeatWhen 行为"}</span>
        ) : (
          logs.map((entry, i) => (
            <div
              key={i}
              className={
                entry.type === "sub" ? styles.logSub : entry.type === "unsub" ? styles.logUnsub : entry.type === "next" ? styles.logNext : styles.logComplete
              }
            >
              {entry.text}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
