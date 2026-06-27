"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { FilterDemoModel } from "./filter-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 7.1.1 filter：按条件过滤数据

const BOOK_CODE = `// 7.1.1 filter：按条件过滤数据
import { filter, range } from "rxjs";

const source$ = range(1, 5);
const even$ = source$.pipe(
  filter((x) => x % 2 === 0),
);

even$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：2, 4, complete`;

const TIMING_CODE = `// filter 的输出时机跟上游 next 一致
import { filter, interval } from "rxjs";

const source$ = interval(1000);
const even$ = source$.pipe(
  filter((x) => x % 2 === 0),
);

// source$ 发出 0、2、4... 时，even$ 立即转发这些值`;

export default function FilterPage() {
  const [demo] = useState(() => new FilterDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.1 filter：按条件过滤数据</h1>
        <p className={styles.subtitle}>
          filter 对上游每个值调用 predicate。返回 true 的值会马上传给下游；返回 false 的值被丢弃。它不改变值本身，只决定是否放行。
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
            <span>predicate</span>
            <code>{"(x) => x % 2 === 0"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <div>
                <h3 className={styles.cardTitle}>source$</h3>
                <p className={styles.cardMeta}>依次发出 1、2、3、4、5</p>
              </div>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.passed ? styles.passToken : styles.dropToken)}>
                      {item.value}
                      <small>{item.passed ? "pass" : "drop"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <div>
                <h3 className={styles.cardTitle}>even$</h3>
                <p className={styles.cardMeta}>只接收 filter 放行的偶数</p>
              </div>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待满足条件的值"}</span>
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
            <strong>逐个判定</strong>：每个上游值都会进入 predicate。
          </li>
          <li>
            <strong>立即放行</strong>：满足条件的值不等 complete，直接传给下游。
          </li>
          <li>
            <strong>只过滤不转化</strong>：filter 不支持结果选择器，也不改变值本身。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="异步流中的输出时机" code={TIMING_CODE} />
    </div>
  );
}
