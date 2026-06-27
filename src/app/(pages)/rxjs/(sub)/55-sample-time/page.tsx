"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { SampleTimeDemoModel } from "./sample-time-demo.model";

// sidebar-title: 7.2.3 sampleTime：固定节拍采样最新值

const BOOK_CODE = `// 7.2.3 sampleTime
import { concat, interval, mapTo, sampleTime, take } from "rxjs";

const source$ = concat(
  interval(500).pipe(take(2), mapTo("A")),
  interval(1000).pipe(take(3), mapTo("B")),
  interval(500).pipe(take(3), mapTo("C")),
);

const result$ = source$.pipe(sampleTime(800));`;

const PERIOD_CODE = `// 修改采样周期
const result$ = source$.pipe(sampleTime(500));

// sampleTime 的输出节拍总是参数 period 的整数倍；
// 如果某个采样块内没有新值，就不会输出。`;

export default function SampleTimePage() {
  const [demo] = useState(() => new SampleTimeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.3 sampleTime：固定节拍采样最新值</h1>
        <p className={styles.subtitle}>sampleTime(period) 不由上游值开启窗口，而是按自己的固定时间节拍采样。每个采样点只会取自上次采样以来的最新上游值。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={run} disabled={state.running}>
                {state.running ? "运行中..." : "运行演示"}
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>source$.pipe(sampleTime(800))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>A/B/C 三段不规则频率；采样节拍独立运行</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span
                      key={`${item.value}-${item.at}-${index}`}
                      className={clsx(
                        styles.token,
                        item.state === "sampled" && styles.passToken,
                        item.state === "stale" && styles.dropToken,
                        item.state === "latest" && styles.pendingToken,
                      )}
                    >
                      {item.value}
                      <small>{item.state}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>固定采样点上的最新值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待第一个采样点"}</span>
                ) : (
                  state.outputs.map((item, index) => (
                    <div key={`${item.value}-${item.at}-${index}`} className={styles.outputLine}>
                      <strong>{item.value}</strong>
                      <span>{item.at}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>采样节拍独立</strong>：采样点不由上游值触发。
          </li>
          <li>
            <strong>取最新值</strong>：每个时间块最多输出一次。
          </li>
          <li>
            <strong>空块不输出</strong>：采样周期内没有新值，就不会重复旧值。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="修改采样周期" code={PERIOD_CODE} />
    </div>
  );
}
