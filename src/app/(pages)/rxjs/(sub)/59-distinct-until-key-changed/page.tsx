"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { DistinctUntilKeyChangedDemoModel } from "./distinct-until-key-changed-demo.model";

// sidebar-title: 7.2.4 distinctUntilKeyChanged：按字段过滤连续重复

const BOOK_CODE = `// 7.2.4 distinctUntilKeyChanged
import { distinctUntilKeyChanged, of } from "rxjs";

const source$ = of(
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
);

const distinct$ = source$.pipe(distinctUntilKeyChanged("name"));`;

const COMPARE_CODE = `// 等价于这个 compare 版本
const compare = (a, b) => a.name === b.name;
const distinct$ = source$.pipe(distinctUntilChanged(compare));

// 如果要比较多个字段，仍然要使用 distinctUntilChanged(compare)。`;

export default function DistinctUntilKeyChangedPage() {
  const [demo] = useState(() => new DistinctUntilKeyChangedDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.4 distinctUntilKeyChanged：按字段过滤连续重复</h1>
        <p className={styles.subtitle}>distinctUntilKeyChanged(key) 是 distinctUntilChanged(compare) 的简写形式，只比较相邻对象的指定字段是否相同。</p>
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
            <code>{'source$.pipe(distinctUntilKeyChanged("name"))'}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>只比较相邻对象的 name 字段</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.label}-${index}`} className={clsx(styles.token, item.passed ? styles.passToken : styles.dropToken)}>
                      {item.label}
                      <small>{item.passed ? "pass" : "drop"}</small>
                      <small>name:{item.keyValue}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>distinct$</h3>
              <p className={styles.cardMeta}>React v16 因 name 连续重复被过滤</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 distinctUntilKeyChanged 输出"}</span>
                ) : (
                  state.outputs.map((item, index) => (
                    <div key={`${item.label}-${index}`} className={styles.outputLine}>
                      <strong>{item.label}</strong>
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
            <strong>单字段简写</strong>：只适合按一个 key 做连续去重。
          </li>
          <li>
            <strong>不是全局 distinct</strong>：非连续重复的 key 仍会再次输出。
          </li>
          <li>
            <strong>多字段用 compare</strong>：复杂比较仍交给 distinctUntilChanged。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="与 distinctUntilChanged(compare) 的关系" code={COMPARE_CODE} />
    </div>
  );
}
