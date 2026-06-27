"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { SampleDemoModel } from "./sample-demo.model";

// sidebar-title: 7.2.3 sample：由 notifier 触发采样

const BOOK_CODE = `// 7.2.3 sample
import { fromEvent, map, sample, timer } from "rxjs";

const notifier$ = fromEvent(document.querySelector("#sample"), "click");
const tick$ = timer(0, 10).pipe(map((x) => x * 10));
const sample$ = tick$.pipe(sample(notifier$));

sample$.subscribe((value) => {
  document.querySelector("#text").innerText = value;
});`;

const SAMPLE_RULE_CODE = `// sample 的参数不是 selector，而是一个 notifier Observable
const sample$ = source$.pipe(sample(notifier$));

// notifier$ 每发出一次，sample 就取 source$ 的最新值。`;

export default function SamplePage() {
  const [demo] = useState(() => new SampleDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const sampleNow = useCallback(() => demo.sampleNow(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.3 sample：由 notifier 触发采样</h1>
        <p className={styles.subtitle}>sample(notifier$) 用另一个 Observable 作为采样信号。notifier$ 每次 next，sample 就把上游 source$ 的最新值传给下游。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={start} disabled={state.running}>
                {state.running ? "运行中..." : "开始"}
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.outputs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>tick$.pipe(sample(click$))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>tick$</h3>
              <p className={styles.cardMeta}>每 100ms 更新一个近似毫秒值</p>
              <div className={styles.outputLine}>
                <strong>{state.latestTick?.value ?? 0}</strong>
                <span>{state.latestTick?.at ?? "未开始"}</span>
              </div>
              <button className={styles.primaryBtn} onClick={sampleNow} disabled={!state.running}>
                Sample
              </button>
              <div className={styles.tokenRow}>
                {state.sampleClicks.length === 0 ? (
                  <span className={styles.empty}>等待 notifier$ 触发</span>
                ) : (
                  state.sampleClicks.map((at) => (
                    <span key={at} className={`${styles.token} ${styles.pendingToken}`}>
                      click
                      <small>{at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>sample$</h3>
              <p className={styles.cardMeta}>每次点击采样时输出当时最新 tick</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 点击 Sample 后输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.value}-${item.at}`} className={styles.outputLine}>
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
            <strong>notifier 决定采样时机</strong>：上游 tick$ 不直接决定输出节奏。
          </li>
          <li>
            <strong>取当前最新值</strong>：每次 notifier next，输出上游最后一次 next 的值。
          </li>
          <li>
            <strong>适合事件取状态</strong>：例如按钮点击时读取当前计时、鼠标位置或表单状态。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书 DOM 示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="sample 的参数规则" code={SAMPLE_RULE_CODE} />
    </div>
  );
}
