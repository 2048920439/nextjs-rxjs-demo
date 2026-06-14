"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { combineLatest, interval, map, Subscription, take, tap } from "rxjs";

import styles from "./styles.module.scss";

type Snapshot = {
  temperature: number;
  wind: string;
};

export default function CombineLatestDemo() {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("点击运行，观察 combineLatest 的最新快照");
  const [temperatureValues, setTemperatureValues] = useState<number[]>([]);
  const [windValues, setWindValues] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const subRef = useRef<Subscription | null>(null);

  const reset = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setRunning(false);
    setStatus("点击运行，观察 combineLatest 的最新快照");
    setTemperatureValues([]);
    setWindValues([]);
    setSnapshots([]);
  }, []);

  const run = useCallback(() => {
    subRef.current?.unsubscribe();
    setRunning(true);
    setStatus("等待两个来源都先发出第一条数据");
    setTemperatureValues([]);
    setWindValues([]);
    setSnapshots([]);

    const temperature$ = interval(700).pipe(
      take(5),
      map((index) => 24 + index),
      tap((value) => {
        setTemperatureValues((prev) => [...prev, value]);
      }),
    );

    const wind$ = interval(1500).pipe(
      take(3),
      map((index) => ["东北风", "东风", "东南风"][index] ?? "东风"),
      tap((value) => {
        setWindValues((prev) => [...prev, value]);
      }),
    );

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    subRef.current = combineLatest([temperature$, wind$]).subscribe({
      next: ([temperature, wind]) => {
        setSnapshots((prev) => [...prev, { temperature, wind }]);
        setStatus(`最新快照：${temperature}°C / ${wind}`);
      },
      complete: () => {
        setStatus(`combineLatest 完成：两边都结束后收工（${stamp()}）`);
        setRunning(false);
        subRef.current = null;
      },
      error: (error) => {
        setStatus(`发生错误：${String(error)}`);
        setRunning(false);
        subRef.current = null;
      },
    });
  }, []);

  useUnmount(() => {
    subRef.current?.unsubscribe();
  });

  const latestSnapshot = snapshots[snapshots.length - 1];

  return (
    <section className={styles.demo}>
      <div className={styles.header}>
        <p className={styles.summary}>{status}</p>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={run} disabled={running}>
            {running ? "运行中..." : "运行演示"}
          </button>
          <button className={styles.secondaryBtn} onClick={reset} disabled={running && snapshots.length === 0}>
            重置
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={clsx(styles.card, styles.tempCard)}>
          <div className={styles.cardTop}>
            <h3 className={styles.cardTitle}>temperature$</h3>
            <span className={styles.cardMeta}>每 700ms 更新一次，模拟温度变化</span>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>已发射 {temperatureValues.length}</span>
            <span className={styles.badge}>{temperatureValues.length > 0 ? `最新 ${temperatureValues[temperatureValues.length - 1]}°C` : "等待中"}</span>
          </div>
          <div className={styles.tokenRow}>
            {temperatureValues.length === 0 ? (
              <span className={styles.empty}>暂无</span>
            ) : (
              temperatureValues.map((v, index) => (
                <span key={`${v}-${index}`} className={styles.token}>
                  {v}°C
                </span>
              ))
            )}
          </div>
        </article>

        <article className={clsx(styles.card, styles.windCard)}>
          <div className={styles.cardTop}>
            <h3 className={styles.cardTitle}>wind$</h3>
            <span className={styles.cardMeta}>每 1500ms 更新一次，模拟风向变化</span>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>已发射 {windValues.length}</span>
            <span className={styles.badge}>{windValues.length > 0 ? `最新 ${windValues[windValues.length - 1]}` : "等待中"}</span>
          </div>
          <div className={styles.tokenRow}>
            {windValues.length === 0 ? (
              <span className={styles.empty}>暂无</span>
            ) : (
              windValues.map((v, index) => (
                <span key={`${v}-${index}`} className={styles.token}>
                  {v}
                </span>
              ))
            )}
          </div>
        </article>
      </div>

      <div className={styles.output}>
        <div className={styles.outputHeader}>
          <span className={styles.outputTitle}>combineLatest 输出</span>
          <span className={styles.outputMeta}>任一源更新都会使用双方的最新值重新组合</span>
        </div>

        {snapshots.length === 0 ? (
          <p className={styles.placeholder}>{"// 先等两边都至少发出一次，才会开始组合输出"}</p>
        ) : (
          snapshots.map((snapshot, index) => (
            <div key={`${snapshot.temperature}-${snapshot.wind}-${index}`} className={styles.outputLine}>
              <span className={styles.outputPair}>
                {snapshot.temperature}°C / {snapshot.wind}
              </span>
            </div>
          ))
        )}

        {latestSnapshot && (
          <div className={styles.latestBox}>
            当前最新快照：{latestSnapshot.temperature}°C + {latestSnapshot.wind}
          </div>
        )}
      </div>
    </section>
  );
}
