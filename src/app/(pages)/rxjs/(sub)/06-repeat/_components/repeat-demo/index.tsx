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
 * 这里尽量贴近书中的核心结构：
 * source$ 先 complete，repeat 才会重新 subscribe 上游。
 * 这样读者能直接看到 repeat 的真实作用，而不是只看一个“重复按钮”。
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

    const source$ = new Observable<number>((subscriber) => {
      addLog("sub", "source$ subscribe");
      subscriber.next(1);
      subscriber.next(2);
      subscriber.next(3);
      subscriber.complete();

      return () => {
        addLog("unsub", "source$ unsubscribe");
      };
    });

    const repeated$ = source$.pipe(repeat(repeatCount));
    let currentRound = 0;

    subscriptionRef.current = repeated$.subscribe({
      next: (val) => {
        if (val === 1) {
          currentRound += 1;
          setRound(currentRound);
        }
        addLog("next", `round ${currentRound}: ${val}`);
      },
      complete: () => {
        addLog("complete", "repeated$ complete");
        setRunning(false);
        subscriptionRef.current = null;
      },
    });
  }, [addLog, repeatCount]);

  const handleCancel = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    addLog("unsub", "manual unsubscribe");
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
            <span className={styles.logEmpty}>点击“开始”查看 repeat 行为</span>
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
