"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { FirstDemoModel, type FirstMode } from "./first-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 7.1.2 first：取第一个匹配值

const BOOK_CODE = `// 7.1.2 first
import { first, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);

source$.pipe(first()).subscribe(console.log);
source$.pipe(first((x) => x % 2 === 0)).subscribe(console.log);

// 输出：3
// 输出：4`;

const INDEX_CODE = `// RxJS 7 不再使用旧版 result selector 参数
// 如果想同时拿到值和序号，可以先用 map 包装
import { first, map, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);

source$
  .pipe(
    map((value, index) => ({ value, index })),
    first((item) => item.value % 2 === 0),
    map((item) => [item.value, item.index]),
  )
  .subscribe(console.log);

// 输出：[4, 2]`;

const DEFAULT_CODE = `// 找不到时可以提供默认值
import { first, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);

source$.pipe(first((x) => x < 0, -1)).subscribe(console.log);

// 输出：-1`;

export default function FirstPage() {
  const [demo] = useState(() => new FirstDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: FirstMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  const predicateLabel = state.mode === "plain" ? "first()" : state.mode === "predicate" ? "first((x) => x % 2 === 0)" : "first((x) => x < 0, -1)";

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.2 first：取第一个匹配值</h1>
        <p className={styles.subtitle}>
          first 可以直接取上游第一个值，也可以带 predicate 寻找第一个匹配值。找到后会立刻输出并 complete；找不到时默认抛 EmptyError，也可以提供默认值。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("plain")} disabled={state.running}>
                第一个值
              </button>
              <button className={styles.primaryBtn} onClick={() => run("predicate")} disabled={state.running}>
                第一个偶数
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
              <p className={styles.cardMeta}>依次发出 3、1、4、1、5、9；first 找到目标后会退订上游</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.value}-${item.at}`} className={styles.token}>
                      <small>#{index}</small>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>first$ 输出</h3>
              <p className={styles.cardMeta}>只输出一个值，然后 complete</p>
              {state.result ? (
                <div className={styles.result}>
                  <strong>{Array.isArray(state.result.value) ? `[${state.result.value.join(", ")}]` : state.result.value}</strong>
                  <span>{state.result.at}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待第一个匹配值"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>可以不传 predicate</strong>：直接取上游第一个 next。
          </li>
          <li>
            <strong>找到后立即结束</strong>：first 不需要等上游 complete。
          </li>
          <li>
            <strong>找不到会报错</strong>：除非提供默认值，否则 complete 时抛 EmptyError。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="值和序号" code={INDEX_CODE} />
      <CodeBlock title="默认值" code={DEFAULT_CODE} />
    </div>
  );
}
