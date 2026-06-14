"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { interval, map, take, tap, zip } from "rxjs";

import styles from "./styles.module.scss";

type PairItem = {
  left: number;
  right: string;
};

export default function ZipDemo() {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("点击运行，观察 zip 的一对一配对");
  const [leftValues, setLeftValues] = useState<number[]>([]);
  const [rightValues, setRightValues] = useState<string[]>([]);
  const [pairs, setPairs] = useState<PairItem[]>([]);
  const subRef = useRef<Subscription | null>(null);

  const reset = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setRunning(false);
    setStatus("点击运行，观察 zip 的一对一配对");
    setLeftValues([]);
    setRightValues([]);
    setPairs([]);
  }, []);

  const run = useCallback(() => {
    subRef.current?.unsubscribe();
    setRunning(true);
    setStatus("左流更快，开始积压等待配对");
    setLeftValues([]);
    setRightValues([]);
    setPairs([]);

    const left$ = interval(350).pipe(
      take(5),
      map((index) => index + 1),
      tap((value) => {
        setLeftValues((prev) => [...prev, value]);
      }),
    );

    const right$ = interval(1000).pipe(
      take(4),
      map((index) => String.fromCharCode(65 + index)),
      tap((value) => {
        setRightValues((prev) => [...prev, value]);
      }),
    );

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    subRef.current = zip(left$, right$).subscribe({
      next: ([left, right]) => {
        setPairs((prev) => [...prev, { left, right }]);
        setStatus(`配对完成：${left} ↔ ${right}`);
      },
      complete: () => {
        setStatus(`zip 完成：最短流结束后收工，extra buffer 将被丢弃（${stamp()}）`);
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

  const leftBuffered = Math.max(0, leftValues.length - pairs.length);
  const rightBuffered = Math.max(0, rightValues.length - pairs.length);

  return (
    <section className={styles.demo}>
      <div className={styles.header}>
        <p className={styles.summary}>{status}</p>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={run} disabled={running}>
            {running ? "运行中..." : "运行演示"}
          </button>
          <button className={styles.secondaryBtn} onClick={reset} disabled={running && pairs.length === 0}>
            重置
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={clsx(styles.card, styles.leftCard)}>
          <div className={styles.cardTop}>
            <h3 className={styles.cardTitle}>source1$</h3>
            <span className={styles.cardMeta}>更快：350ms 一次，先进入缓冲区</span>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>已发射 {leftValues.length}</span>
            <span className={styles.badge}>缓冲 {leftBuffered}</span>
          </div>
          <div className={styles.tokenRow}>
            {leftValues.length === 0 ? (
              <span className={styles.empty}>暂无</span>
            ) : (
              leftValues.map((v) => (
                <span key={v} className={styles.token}>
                  {v}
                </span>
              ))
            )}
          </div>
        </article>

        <article className={clsx(styles.card, styles.rightCard)}>
          <div className={styles.cardTop}>
            <h3 className={styles.cardTitle}>source2$</h3>
            <span className={styles.cardMeta}>更慢：1000ms 一次，决定配对节奏</span>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>已发射 {rightValues.length}</span>
            <span className={styles.badge}>缓冲 {rightBuffered}</span>
          </div>
          <div className={styles.tokenRow}>
            {rightValues.length === 0 ? (
              <span className={styles.empty}>暂无</span>
            ) : (
              rightValues.map((v) => (
                <span key={v} className={styles.token}>
                  {v}
                </span>
              ))
            )}
          </div>
        </article>
      </div>

      <div className={styles.output}>
        <div className={styles.outputHeader}>
          <span className={styles.outputTitle}>zipped$ 输出</span>
          <span className={styles.outputMeta}>只在两边都准备好一个值时放行</span>
        </div>

        {pairs.length === 0 ? (
          <p className={styles.placeholder}>{"// 配对结果会以 [左值, 右值] 的形式出现"}</p>
        ) : (
          pairs.map((pair, index) => (
            <div key={`${pair.left}-${pair.right}-${index}`} className={styles.outputLine}>
              <span className={styles.outputPair}>
                [{pair.left}, {pair.right}]
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
