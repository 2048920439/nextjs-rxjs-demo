"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { RepeatDemoModel } from "./repeat-demo.model";

const BOOK_CODE = `import { Observable, repeat } from 'rxjs';

source$.pipe(repeat(2)).subscribe(console.log);
// 上游 complete 后，repeat 才会重新订阅`;

export default function RepeatPage() {
  const [demo] = useState(() => new RepeatDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const cancel = useCallback(() => demo.cancel(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2.5 repeat：完成后重复订阅</h1>
        <p className={styles.subtitle}>repeat 的关键不是重复 next，而是在上游 complete 后重新订阅整个上游 Observable。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>
              当前轮次：{state.round || "-"} / {state.repeatCount}
            </p>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span>重复次数</span>
                <input
                  type="number"
                  className={styles.input}
                  value={state.repeatCount}
                  min={1}
                  max={10}
                  onChange={(event) => demo.setRepeatCount(Number(event.target.value) || 2)}
                  disabled={state.running}
                />
              </label>
              {state.running ? (
                <button className={styles.secondaryBtn} onClick={cancel}>
                  取消
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={start}>
                  开始
                </button>
              )}
            </div>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>repeat 日志</span>
              <span className={styles.outputMeta}>subscribe / unsubscribe / next</span>
            </div>
            {state.logs.length === 0 ? (
              <p className={styles.placeholder}>点击“开始”查看 repeat 行为</p>
            ) : (
              state.logs.map((entry, index) => (
                <div key={`${entry.type}-${index}`} className={clsx(styles.outputLine, styles[entry.type])}>
                  {entry.text}
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
            <strong>依赖 complete</strong>：只有上游完成，repeat 才会重新订阅。
          </li>
          <li>
            <strong>重复的是订阅过程</strong>：副作用也会随每轮订阅重新执行。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
