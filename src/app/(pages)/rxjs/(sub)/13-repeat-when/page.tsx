"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { RepeatWhenDemoModel } from "./repeat-when-demo.model";

const BOOK_CODE = `// 4.3.7 repeatWhen
source$.pipe(
  repeatWhen((complete$) => complete$.pipe(delay(2000))),
);`;

export default function RepeatWhenPage() {
  const [demo] = useState(() => new RepeatWhenDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const stop = useCallback(() => demo.stop(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.7 repeatWhen：由通知流控制重复</h1>
        <p className={styles.subtitle}>repeatWhen 不会立即重复订阅，而是把 complete 信号交给一个通知流；通知流发出值时，才会重新订阅上游。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>
              当前轮次：{state.round || "-"}；每 {state.delay}ms 重新订阅一次。
            </p>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span>重订阅间隔(ms)</span>
                <input
                  type="number"
                  className={styles.input}
                  value={state.delay}
                  min={500}
                  step={500}
                  onChange={(event) => demo.setDelay(Number(event.target.value) || 2000)}
                  disabled={state.running}
                />
              </label>
              {state.running ? (
                <button className={styles.secondaryBtn} onClick={stop}>
                  停止
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
              <span className={styles.outputTitle}>repeatWhen 日志</span>
              <span className={styles.outputMeta}>subscribe / unsubscribe / next</span>
            </div>
            {state.logs.length === 0 ? (
              <p className={styles.placeholder}>点击“开始”查看 repeatWhen 行为</p>
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
            <strong>上游完成后才触发</strong>：repeatWhen 监听的是 complete 信号。
          </li>
          <li>
            <strong>通知流决定节奏</strong>：通知流发出一次，就重新订阅一次上游。
          </li>
          <li>
            <strong>适合轮询</strong>：可以用 timer/interval 控制下一轮请求或计算的开始时间。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
