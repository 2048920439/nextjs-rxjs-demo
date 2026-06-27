"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { SingleDemoModel, type SingleMode } from "./single-demo.model";

// sidebar-title: 7.3.3 single：要求唯一匹配

const BOOK_CODE = `// 7.3.3 single
import { interval, single, take } from "rxjs";

const source$ = interval(1000).pipe(take(2));
const result$ = source$.pipe(single((x) => x % 2 === 0));

result$.subscribe(console.log);

// source$ 只发出 0 和 1，唯一偶数是 0`;

const ERROR_CODE = `// 多个值满足条件会 error
import { interval, single } from "rxjs";

const source$ = interval(1000);
const result$ = source$.pipe(single((x) => x % 2 === 0));

// 当 source$ 发出 2 时，single 发现第二个偶数，抛出错误`;

export default function SinglePage() {
  const [demo] = useState(() => new SingleDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: SingleMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.3.3 single：要求唯一匹配</h1>
        <p className={styles.subtitle}>single(predicate) 要求上游只有一个值满足条件。唯一匹配时输出这个值；没有匹配或出现第二个匹配时都会进入错误路径。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("unique")} disabled={state.running}>
                唯一匹配
              </button>
              <button className={styles.primaryBtn} onClick={() => run("multiple")} disabled={state.running}>
                多个匹配
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>predicate</span>
            <code>{"single((x) => x % 2 === 0)"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>{state.mode === "unique" ? "发出 0、1 后 complete" : "发出 0、1、2；第二个偶数触发错误"}</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.matched ? styles.passToken : styles.dropToken)}>
                      {item.value}
                      <small>{item.matched ? "match" : "skip"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>唯一匹配输出值；第二个匹配立刻报错</p>
              {state.result ? (
                <div className={styles.outputLine}>
                  <strong>{state.result.kind === "value" ? state.result.value : "error"}</strong>
                  <span>{`${state.result.message} · ${state.result.at}`}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待唯一匹配或错误"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>必须唯一</strong>：不是取第一个匹配，而是检查只有一个匹配。
          </li>
          <li>
            <strong>多匹配会提前 error</strong>：发现第二个满足条件的值时立刻失败。
          </li>
          <li>
            <strong>唯一匹配要等 complete</strong>：只有上游完成后才能确认没有第二个匹配。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="多个匹配的错误路径" code={ERROR_CODE} />
    </div>
  );
}
