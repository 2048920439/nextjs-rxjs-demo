"use client";

import { useUnmount } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { Observable, repeat, Subscription } from "rxjs";

import styles from "./styles.module.scss";

type LogType = "sub" | "unsub" | "next" | "complete";

interface LogEntry {
  type: LogType;
  text: string;
}

/**
 * 4.2.5 repeat 交互演示
 *
 * 模拟书中示例：用定时 source$ 产生 1, 2, 3，然后用 repeat 重复 N 次。
 * 展示每次重复时的 subscribe / unsubscribe 日志。
 */
export default function RepeatDemo() {
  const [repeatCount, setRepeatCount] = useState(2);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const subscriptionRef = useRef<Subscription | null>(null);

  const addLog = useCallback((type: LogType, text: string) => {
    setLogs((prev) => [...prev, { type, text }]);
  }, []);

  const handleStart = useCallback(() => {
    setLogs([]);
    setRound(0);
    setRunning(true);

    // 模拟书中 timed source$：每 800ms 吐出一个值，3 个值后 complete
    const source$ = new Observable<number>((subscriber) => {
      const roundId = Math.floor(Math.random() * 9000) + 1000;
      addLog("sub", `[订阅 #${roundId}] on subscribe`);

      let n = 0;
      const handle = setInterval(() => {
        n++;
        subscriber.next(n);
      }, 800);

      // 3 个值后 complete
      setTimeout(() => {
        clearInterval(handle);
        subscriber.complete();
      }, 2600);

      return () => {
        clearInterval(handle);
        addLog("unsub", `[订阅 #${roundId}] on unsubscribe`);
      };
    });

    const repeated$ = source$.pipe(repeat(repeatCount));

    let currentRound = 0;

    subscriptionRef.current = repeated$.subscribe({
      next: (val) => {
        if (val === 1) {
          currentRound++;
          setRound(currentRound);
        }
        addLog("next", `第 ${currentRound} 轮: ${val}`);
      },
      complete: () => {
        addLog("complete", "repeated$ complete — 所有轮次结束");
        setRunning(false);
      },
    });
  }, [repeatCount, addLog]);

  const handleCancel = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    addLog("unsub", "手动取消订阅");
    setRunning(false);
  }, [addLog]);

  useUnmount(() => {
    subscriptionRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={styles.controls}>
        <span className={styles.label}>重复次数:</span>
        <input
          type="number"
          className={styles.repeatInput}
          value={repeatCount}
          min={1}
          max={10}
          onChange={(e) => setRepeatCount(Number(e.target.value) || 2)}
          disabled={running}
        />
        {!running ? (
          <button className={styles.actionBtn} onClick={handleStart}>
            开始
          </button>
        ) : (
          <button className={styles.cancelBtn} onClick={handleCancel}>
            取消
          </button>
        )}
      </div>

      {running && (
        <div className={styles.roundLabel}>
          当前轮次: {round} / {repeatCount}
        </div>
      )}

      <div className={styles.output}>
        <span className={styles.logLabel}>输出日志:</span>
        <div className={styles.logArea}>
          {logs.length === 0 ? (
            <span className={styles.logEmpty}>{"// 点击\u201C开始\u201D查看 repeat 行为"}</span>
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
      </div>
    </section>
  );
}
