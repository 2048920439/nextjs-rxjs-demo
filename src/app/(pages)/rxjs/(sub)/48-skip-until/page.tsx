"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { SkipUntilDemoModel } from "./skip-until-demo.model";

// sidebar-title: 7.1.7 skipUntil：等 notifier 后开始转发

const BOOK_CODE = `// 7.1.7 skipUntil
import { interval, skipUntil, timer } from "rxjs";

const source$ = interval(1000);
const notifier$ = timer(2500);
const result$ = source$.pipe(skipUntil(notifier$));

result$.subscribe(console.log);

// notifier$ 触发前的值被跳过，之后开始输出`;

const TAKE_COMPARE_CODE = `// skipUntil 和 takeUntil 是相反的开关方向
source$.pipe(skipUntil(notifier$));
// notifier$ 触发前跳过，触发后转发

source$.pipe(takeUntil(notifier$));
// notifier$ 触发前转发，触发后 complete`;

export default function SkipUntilPage() {
  const [demo] = useState(() => new SkipUntilDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.7 skipUntil：等 notifier 后开始转发</h1>
        <p className={styles.subtitle}>
          skipUntil(notifier$) 会跳过 notifier$ 第一次 next 之前的上游值；notifier 触发后，通道打开，后续 source$ 值会进入下游。
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
            <code>source$.pipe(skipUntil(timer(1500)))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每 450ms 发值；notifier 前的值被跳过</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.skipped ? styles.skipToken : styles.passToken)}>
                      {item.value}
                      <small>{item.skipped ? "skip" : "pass"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>notifier 触发后开始输出</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 notifier$ 打开通道"}</span>
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
            <strong>{state.notifierAt ? `触发于 ${state.notifierAt}` : "等待 1500ms 后触发"}</strong>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>notifier 打开通道</strong>：触发前的 source$ 值都会被跳过。
          </li>
          <li>
            <strong>触发后持续转发</strong>：notifier 只负责开启，不会让 result$ complete。
          </li>
          <li>
            <strong>和 takeUntil 相反</strong>：takeUntil 是触发前转发，触发后结束。
          </li>
        </ul>
      </aside>

      <CodeBlock title="RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="和 takeUntil 的区别" code={TAKE_COMPARE_CODE} />
    </div>
  );
}
