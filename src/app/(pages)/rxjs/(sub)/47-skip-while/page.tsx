"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { SkipWhileDemoModel } from "./skip-while-demo.model";

// sidebar-title: 7.1.7 skipWhile：条件为真时跳过开头

const BOOK_CODE = `// 7.1.7 skipWhile
import { interval, skipWhile } from "rxjs";

const source$ = interval(1000);
const skipWhile$ = source$.pipe(
  skipWhile((value) => value % 2 === 0),
);

skipWhile$.subscribe(console.log);

// 输出：1, 2, 3, 4...`;

const FILTER_COMPARE_CODE = `// skipWhile 不是 filter
source$.pipe(skipWhile((value) => value % 2 === 0));
// 只跳过开头连续偶数，遇到 1 后，后面的 2、4 也会转发

source$.pipe(filter((value) => value % 2 !== 0));
// 会过滤整个数据流里的偶数`;

export default function SkipWhilePage() {
  const [demo] = useState(() => new SkipWhileDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.7 skipWhile：条件为真时跳过开头</h1>
        <p className={styles.subtitle}>
          skipWhile(predicate) 会跳过开头连续满足 predicate 的值；一旦第一次返回 false，跳过阶段就结束，后续所有值都会原样转发。
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
            <code>{"(value) => value % 2 === 0"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>0 是开头偶数被跳过；遇到 1 后，2、4 也会转发</p>
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
              <h3 className={styles.cardTitle}>skipWhile$</h3>
              <p className={styles.cardMeta}>从第一个奇数 1 开始，后续都转发</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待第一个 predicate=false 的值"}</span>
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
            <strong>只看开头连续段</strong>：predicate 为 true 时持续跳过。
          </li>
          <li>
            <strong>第一次 false 打开通道</strong>：打开后不再调用跳过逻辑来阻断后续值。
          </li>
          <li>
            <strong>不是 filter</strong>：后面的偶数 2、4 会照常进入下游。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="和 filter 的区别" code={FILTER_COMPARE_CODE} />
    </div>
  );
}
