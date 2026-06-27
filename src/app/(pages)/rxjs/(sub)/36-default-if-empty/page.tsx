"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { DefaultIfEmptyDemoModel, type DefaultIfEmptyMode } from "./default-if-empty-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 6.2.4 defaultIfEmpty：空流补默认值

const BOOK_CODE = `// 6.2.4 defaultIfEmpty：空流补默认值
import { defaultIfEmpty, EMPTY } from "rxjs";

const source$ = EMPTY;
const result$ = source$.pipe(defaultIfEmpty("this is default"));

result$.subscribe(console.log);

// 输出：this is default`;

const PASS_THROUGH_CODE = `// 如果上游不是空的，defaultIfEmpty 原样转发
import { defaultIfEmpty, of } from "rxjs";

const source$ = of("A", "B", "C");
const result$ = source$.pipe(defaultIfEmpty("this is default"));

result$.subscribe(console.log);

// 输出：A, B, C`;

export default function DefaultIfEmptyPage() {
  const [demo] = useState(() => new DefaultIfEmptyDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: DefaultIfEmptyMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.2.4 defaultIfEmpty：空流补默认值</h1>
        <p className={styles.subtitle}>
          defaultIfEmpty 会检查上游是否为空。空流 complete 时，它输出给定默认值；只要上游发过任何值，它就不再补默认值，而是原样转发上游。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("empty")} disabled={state.running}>
                空流
              </button>
              <button className={styles.primaryBtn} onClick={() => run("not-empty")} disabled={state.running}>
                非空流
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.outputs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.pipeline}>
            <code>source$.pipe(defaultIfEmpty(&quot;this is default&quot;))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>{state.mode === "empty" ? "不发 next，只 complete" : "发出 A、B、C 后 complete"}</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>暂无 source next</span>
                ) : (
                  state.sourceValues.map((value) => (
                    <span key={value} className={styles.token}>
                      {value}
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>下游收到的值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.value}-${item.at}`} className={styles.outputLine}>
                      <span className={clsx(styles.outputTag, item.source === "default" && styles.defaultTag)}>{item.source}</span>
                      <strong>{item.value}</strong>
                      <small>{item.at}</small>
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
            <strong>空流补一个值</strong>：上游 complete 前没有任何 next，就输出默认值。
          </li>
          <li>
            <strong>非空不改数据</strong>：只要上游发过值，就完整转发上游的 next。
          </li>
          <li>
            <strong>只能补单值</strong>：它不能把空流替换成多个值组成的新流。
          </li>
        </ul>
      </aside>

      <CodeBlock title="空流补默认值" code={BOOK_CODE} />
      <CodeBlock title="非空流原样转发" code={PASS_THROUGH_CODE} />
    </div>
  );
}
