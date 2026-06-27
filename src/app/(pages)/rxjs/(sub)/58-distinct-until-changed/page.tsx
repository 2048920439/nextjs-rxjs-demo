"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { DistinctUntilChangedDemoModel, type DistinctUntilChangedMode } from "./distinct-until-changed-demo.model";

// sidebar-title: 7.2.4 distinctUntilChanged：过滤连续重复

const BOOK_CODE = `// 7.2.4 distinctUntilChanged
import { distinctUntilChanged, of } from "rxjs";

const source$ = of(0, 1, 1, 2, 0, 0, 1, 3, 3);
const distinct$ = source$.pipe(distinctUntilChanged());

distinct$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：0, 1, 2, 0, 1, 3, complete`;

const COMPARE_CODE = `// 使用 compare 比较对象
const source$ = of(
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
);

const compare = (a, b) => a.name === b.name;
const distinct$ = source$.pipe(distinctUntilChanged(compare));`;

export default function DistinctUntilChangedPage() {
  const [demo] = useState(() => new DistinctUntilChangedDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: DistinctUntilChangedMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.4 distinctUntilChanged：过滤连续重复</h1>
        <p className={styles.subtitle}>
          distinctUntilChanged 不维护全局集合，只保存上一个值。当前值和上一个值相同才会被过滤；隔了一段之后再次出现仍会进入下游。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("primitive")} disabled={state.running}>
                数字去重
              </button>
              <button className={styles.secondaryBtn} onClick={() => run("compare")} disabled={state.running}>
                compare
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.mode === "primitive" ? "source$.pipe(distinctUntilChanged())" : "source$.pipe(distinctUntilChanged(compare))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>只丢弃和上一个值连续重复的项</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>选择一个场景运行</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.label}-${index}`} className={clsx(styles.token, item.passed ? styles.passToken : styles.dropToken)}>
                      {item.label}
                      <small>{item.passed ? "pass" : "drop"}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>distinct$</h3>
              <p className={styles.cardMeta}>非连续重复可以再次输出</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 distinctUntilChanged 输出"}</span>
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
            <strong>只看上一个值</strong>：不会记住更早出现过的所有值。
          </li>
          <li>
            <strong>适合状态去噪</strong>：连续相同状态不必重复渲染或请求。
          </li>
          <li>
            <strong>compare 返回 true 表示相同</strong>：返回 true 时当前值会被过滤。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="对象 compare 写法" code={COMPARE_CODE} />
    </div>
  );
}
