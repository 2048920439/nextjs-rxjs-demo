"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { LastDemoModel, type LastMode } from "./last-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 7.1.3 last：取最后一个匹配值

const BOOK_CODE = `// 7.1.3 last
import { last, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9, 2, 6);

source$.pipe(last()).subscribe(console.log);
source$.pipe(last((x) => x % 2 === 0)).subscribe(console.log);

// 输出：6
// 输出：6`;

const TIMING_CODE = `// last 必须等上游 complete
import { interval, last, take } from "rxjs";

const source$ = interval(1000).pipe(take(5));
const lastEven$ = source$.pipe(last((x) => x % 2 === 0));

lastEven$.subscribe(console.log);

// 2 在第 3 秒已经出现，但要等 source$ complete 后才输出`;

const DEFAULT_CODE = `// 找不到时可以提供默认值
import { last, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);

source$.pipe(last((x) => x < 0, -1)).subscribe(console.log);

// 输出：-1`;

export default function LastPage() {
  const [demo] = useState(() => new LastDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: LastMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  const predicateLabel = state.mode === "plain" ? "last()" : state.mode === "predicate" ? "last((x) => x % 2 === 0)" : "last((x) => x < 0, -1)";

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.3 last：取最后一个匹配值</h1>
        <p className={styles.subtitle}>
          last 和 first 相反，它要取最后一个值或最后一个匹配值。只要上游还没 complete，last 就不能确定当前候选值是否真的是最后一个。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("plain")} disabled={state.running}>
                最后一个值
              </button>
              <button className={styles.primaryBtn} onClick={() => run("predicate")} disabled={state.running}>
                最后偶数
              </button>
              <button className={styles.primaryBtn} onClick={() => run("default")} disabled={state.running}>
                默认值
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{predicateLabel}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>依次发出 3、1、4、1、5、9、2、6；候选值要等 complete 才能确认</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.candidate ? styles.candidateToken : styles.dropToken)}>
                      {item.value}
                      <small>{item.candidate ? "candidate" : "skip"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>last$ 输出</h3>
              <p className={styles.cardMeta}>只在 source$ complete 后输出一次</p>
              {state.result ? (
                <div className={styles.result}>
                  <strong>{state.result.value}</strong>
                  <span>{state.result.at}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待 source$ complete"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>必须等 complete</strong>：最后一个值只有在上游结束后才能确认。
          </li>
          <li>
            <strong>候选值会被覆盖</strong>：后面出现的新匹配值会替换之前的候选值。
          </li>
          <li>
            <strong>找不到会报错</strong>：除非提供默认值，否则 complete 时抛 EmptyError。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="输出时机" code={TIMING_CODE} />
      <CodeBlock title="默认值" code={DEFAULT_CODE} />
    </div>
  );
}
