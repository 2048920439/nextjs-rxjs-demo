"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { TakeUntilDemoModel } from "./take-until-demo.model";

// sidebar-title: 7.1.4 takeUntil：由 notifier 控制结束

const BOOK_CODE = `// 7.1.4 takeUntil
import { interval, takeUntil, timer } from "rxjs";

const source$ = interval(1000);
const notifier$ = timer(2500);
const result$ = source$.pipe(takeUntil(notifier$));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：0, 1, complete`;

const CLICK_CODE = `// 常见用途：限时事件流
import { fromEvent, takeUntil, timer } from "rxjs";

const click$ = fromEvent(button, "click");
const countDown$ = timer(5000);

click$.pipe(takeUntil(countDown$)).subscribe(() => {
  count += 1;
});`;

export default function TakeUntilPage() {
  const [demo] = useState(() => new TakeUntilDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.4 takeUntil：由 notifier 控制结束</h1>
        <p className={styles.subtitle}>
          takeUntil(notifier$) 会直接转发上游值，直到 notifier$ 发出第一个 next。notifier 就像开关，一旦触发就关闭上游到下游的通道。
        </p>
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
            <code>source$.pipe(takeUntil(timer(1800)))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每 700ms 发出一个递增数字</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={styles.token}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>notifier 触发前持续转发</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待输出"}</span>
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

          <div className={styles.notifier}>
            <span>notifier$</span>
            <strong>{state.notifierAt ? `触发于 ${state.notifierAt}` : "等待 1800ms 后触发"}</strong>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>notifier 控制结束</strong>：notifier$ 第一次 next 会让 result$ complete。
          </li>
          <li>
            <strong>触发前直接转发</strong>：source$ 的值在关闭前不被改变。
          </li>
          <li>
            <strong>适合生命周期</strong>：限时点击、组件销毁、取消请求都常用这个模式。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="限时事件流" code={CLICK_CODE} />
    </div>
  );
}
