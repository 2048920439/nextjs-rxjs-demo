"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { EveryDemoModel, type EveryMode } from "./every-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 6.2.1 every：全部满足判定

const TRUE_CODE = `// 6.2.1 every：全部满足判定
import { every, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);
const every$ = source$.pipe(every((x) => x > 0));

every$.subscribe(console.log);

// source$ complete 后输出：true`;

const FALSE_CODE = `// every 可以提前输出 false
import { every, interval } from "rxjs";

const source$ = interval(1000);
const every$ = source$.pipe(every((x) => x < 3));

every$.subscribe(console.log);

// source$ 发出 3 时输出：false，然后 complete`;

export default function EveryPage() {
  const [demo] = useState(() => new EveryDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: EveryMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.2.1 every：全部满足判定</h1>
        <p className={styles.subtitle}>
          every 使用 predicate 检查每个上游值。全部通过时，它要等上游 complete 才输出 true；一旦某个值不通过，就能立刻输出 false 并结束。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("all-pass")} disabled={state.running}>
                全部通过
              </button>
              <button className={styles.primaryBtn} onClick={() => run("fail-fast")} disabled={state.running}>
                提前失败
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>predicate</span>
            <code>{state.mode === "all-pass" ? "(x) => x > 0" : "(x) => x < 3"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <div>
                <h3 className={styles.cardTitle}>source$</h3>
                <p className={styles.cardMeta}>进入 every 判定函数的值</p>
              </div>
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
              <div>
                <h3 className={styles.cardTitle}>source$.pipe(every(predicate))</h3>
                <p className={styles.cardMeta}>只输出一个布尔值，然后 complete</p>
              </div>
              {state.result ? (
                <div className={styles.result}>
                  <strong>{String(state.result.value)}</strong>
                  <span>{state.result.at}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 还没有得到判定结果"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>true 等 complete</strong>：只有上游结束，才能确认所有值都满足条件。
          </li>
          <li>
            <strong>false 可提前</strong>：发现第一个 false 后，后面的值不需要再看。
          </li>
          <li>
            <strong>永不完结要谨慎</strong>：如果无限流一直满足条件，every 就永远没有 true 结果。
          </li>
        </ul>
      </aside>

      <CodeBlock title="输出 true 的场景" code={TRUE_CODE} />
      <CodeBlock title="提前输出 false 的场景" code={FALSE_CODE} />
    </div>
  );
}
