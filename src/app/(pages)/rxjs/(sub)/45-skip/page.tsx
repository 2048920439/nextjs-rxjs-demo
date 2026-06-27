"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { SkipDemoModel } from "./skip-demo.model";

// sidebar-title: 7.1.6 skip：跳过前 N 个值

const BOOK_CODE = `// 7.1.6 skip
import { interval, skip } from "rxjs";

const source$ = interval(1000);
const skip$ = source$.pipe(skip(3));

skip$.subscribe(console.log);

// 等待前三个值 0、1、2 被跳过后，输出：3, 4, 5...`;

const EMPTY_CODE = `// 如果上游值不够 count 个，skip 只会等待上游 complete
import { of, skip } from "rxjs";

of(0, 1).pipe(skip(3)).subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：complete`;

export default function SkipPage() {
  const [demo] = useState(() => new SkipDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.6 skip：跳过前 N 个值</h1>
        <p className={styles.subtitle}>skip(count) 会静默忽略上游最开始的 count 个 next；跳过完成后，它不再改变数据，后续值会按原样进入下游。</p>
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
            <code>skip(3)</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 0 到 6；前三个值被跳过</p>
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
              <h3 className={styles.cardTitle}>skip$</h3>
              <p className={styles.cardMeta}>只收到从 3 开始的值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待前三个值被跳过"}</span>
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
            <strong>只丢弃开头</strong>：跳过数量达到 count 后，后续值不再被过滤。
          </li>
          <li>
            <strong>不改变值</strong>：skip 只决定是否转发，不修改 next 的内容。
          </li>
          <li>
            <strong>数量不够也会完成</strong>：上游 complete 时，skip 也会跟着 complete。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="上游值不够 count 个" code={EMPTY_CODE} />
    </div>
  );
}
