"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { TimingDemoModel } from "./timing-demo.model";

const BOOK_CODE = `import { interval, timer } from 'rxjs';

interval(1000).subscribe(console.log);
timer(2000, 1000).subscribe(console.log);`;

export default function IntervalTimerPage() {
  const [demo] = useState(() => new TimingDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const startInterval = useCallback(() => demo.startInterval(), [demo]);
  const stopInterval = useCallback(() => demo.stopInterval(), [demo]);
  const startTimer = useCallback(() => demo.startTimer(), [demo]);
  const stopTimer = useCallback(() => demo.stopTimer(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.1 interval 和 timer</h1>
        <p className={styles.subtitle}>interval 按固定周期持续发射；timer 可以先延迟一次，再进入周期发射。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>interval(1000)</h3>
            <p className={styles.cardDesc}>每隔 1000ms 吐出递增整数，默认不会自动完成。</p>
            <div className={styles.counter}>{state.intervalRunning ? state.intervalCount : "-"}</div>
            {state.intervalRunning ? (
              <button className={styles.secondaryBtn} onClick={stopInterval}>
                停止
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={startInterval}>
                启动
              </button>
            )}
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>timer(delay, period)</h3>
            <p className={styles.cardDesc}>先等待 delay，再按 period 周期发射。</p>
            <label className={styles.field}>
              <span>初始延迟(ms)</span>
              <input
                type="number"
                className={styles.input}
                value={state.timerDelay}
                min={500}
                step={500}
                onChange={(event) => demo.setTimerDelay(Number(event.target.value) || 2000)}
                disabled={state.timerRunning}
              />
            </label>
            <div className={styles.counter}>{state.timerRunning ? (state.timerCount ?? "等待中...") : "-"}</div>
            {state.timerRunning ? (
              <button className={styles.secondaryBtn} onClick={stopTimer}>
                停止
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={startTimer}>
                启动
              </button>
            )}
          </article>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>interval</strong>：固定周期发射递增数字。
          </li>
          <li>
            <strong>timer</strong>：可以只延迟一次，也可以延迟后周期发射。
          </li>
          <li>
            <strong>需要退订</strong>：定时流通常不会自己结束，离开页面前要 unsubscribe。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
