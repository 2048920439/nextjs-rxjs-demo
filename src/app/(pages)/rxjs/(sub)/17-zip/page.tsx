"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { ZipDemoModel } from "./zip-demo.model";

const BOOK_CODE = `// 5.1.3 zip：拉链式配对
import { zip, of } from 'rxjs';

const source1$ = of(1, 2, 3);
const source2$ = of('A', 'B', 'C');

zip(source1$, source2$).subscribe(console.log);
// [1, 'A'], [2, 'B'], [3, 'C']`;

const BOOK_CODE_MORE = `// 如果某一边更快，zip 会先把它缓存起来
// 只有所有输入流都准备好一个值，才会输出一组配对`;

export default function ZipPage() {
  const [demo] = useState(() => new ZipDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);
  const leftBuffered = Math.max(0, state.leftValues.length - state.pairs.length);
  const rightBuffered = Math.max(0, state.rightValues.length - state.pairs.length);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.3 zip：拉链式配对</h1>
        <p className={styles.subtitle}>zip 会等待每个输入流都准备好一个值，然后按位置配成一组输出；快的一边会进入缓冲区等待慢的一边。</p>
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.pairs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.leftCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>source1$</h3>
                <span className={styles.cardMeta}>更快：350ms 一次，先进缓冲区</span>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>已发射 {state.leftValues.length}</span>
                <span className={styles.badge}>缓冲 {leftBuffered}</span>
              </div>
              <div className={styles.tokenRow}>
                {state.leftValues.length === 0 ? (
                  <span className={styles.empty}>暂无</span>
                ) : (
                  state.leftValues.map((value) => (
                    <span key={value} className={styles.token}>
                      {value}
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={clsx(styles.card, styles.rightCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>source2$</h3>
                <span className={styles.cardMeta}>更慢：1000ms 一次，决定配对节奏</span>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>已发射 {state.rightValues.length}</span>
                <span className={styles.badge}>缓冲 {rightBuffered}</span>
              </div>
              <div className={styles.tokenRow}>
                {state.rightValues.length === 0 ? (
                  <span className={styles.empty}>暂无</span>
                ) : (
                  state.rightValues.map((value) => (
                    <span key={value} className={styles.token}>
                      {value}
                    </span>
                  ))
                )}
              </div>
            </article>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>zipped$ 输出</span>
              <span className={styles.outputMeta}>只有两边都准备好一个值时才放行</span>
            </div>

            {state.pairs.length === 0 ? (
              <p className={styles.placeholder}>{"// 配对结果会以 [左值, 右值] 的形式出现"}</p>
            ) : (
              state.pairs.map((pair, index) => (
                <div key={`${pair.left}-${pair.right}-${index}`} className={styles.outputLine}>
                  <span className={styles.outputPair}>
                    [{pair.left}, {pair.right}]
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>按位置配对</strong>：每个输入流各拿一个值，组成一组输出。
          </li>
          <li>
            <strong>快流会缓存</strong>：先到的数据不会立刻输出，而是等其他流补齐。
          </li>
          <li>
            <strong>最短流决定完成</strong>：任一输入流结束且无法继续配对时，zip 输出完成。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="缓冲与配对规则" code={BOOK_CODE_MORE} />
    </div>
  );
}
