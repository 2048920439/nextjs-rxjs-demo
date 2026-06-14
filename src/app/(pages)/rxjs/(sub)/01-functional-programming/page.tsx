"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { HoldTimerDemoModel } from "./hold-timer-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `const mouseDown$ = Rx.Observable.fromEvent(button, 'mousedown');
const mouseUp$ = Rx.Observable.fromEvent(button, 'mouseup');

const holdTime$ = mouseUp$
  .timestamp()
  .withLatestFrom(mouseDown$.timestamp(), (up, down) => {
    return up.timestamp - down.timestamp;
  });

holdTime$.subscribe(ms => {
  document.querySelector('#hold-time').innerText = ms;
});`;

export default function FunctionalProgrammingPage() {
  const [demo] = useState(() => new HoldTimerDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const imperativeDown = useCallback(() => demo.imperativeDown(), [demo]);
  const imperativeUp = useCallback(() => demo.imperativeUp(), [demo]);
  const reactiveDown = useCallback(() => demo.reactiveDown(), [demo]);
  const reactiveUp = useCallback(() => demo.reactiveUp(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>1.1 一个简单的 RxJS 例子</h1>
        <p className={styles.subtitle}>按住按钮计时：对比“命令式”和“响应式”两种编程范式。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>React 实现对比</h2>
        <div className={styles.grid}>
          <section className={styles.card}>
            <h3 className={styles.title}>命令式 Imperative</h3>
            <button className={styles.holdBtn} onMouseDown={imperativeDown} onMouseUp={imperativeUp} onMouseLeave={imperativeUp}>
              按住我，松手计时
            </button>
            <p className={styles.time}>
              按住时长：<span className={styles.value}>{state.imperativeMs}</span> ms
            </p>
            <p className={styles.note}>
              手动记录 <code>startTime</code>，在 mouseup 回调里计算差值。
            </p>
          </section>

          <section className={styles.card}>
            <h3 className={styles.title}>响应式 Reactive</h3>
            <button className={styles.holdBtn} onMouseDown={reactiveDown} onMouseUp={reactiveUp} onMouseLeave={reactiveUp}>
              按住我，松手计时
            </button>
            <p className={styles.time}>
              按住时长：<span className={styles.value}>{state.reactiveMs}</span> ms
            </p>
            <p className={styles.note}>
              事件进入 Observable，通过 <code>timestamp + withLatestFrom</code> 声明式计算时长。
            </p>
          </section>
        </div>
      </section>

      <aside className={styles.description}>
        <h3>核心差异</h3>
        <ul>
          <li>
            <strong>命令式</strong>：关注 How，手动管理事件监听、临时变量和 DOM 更新顺序。
          </li>
          <li>
            <strong>响应式</strong>：关注 What，把事件看成数据流，再用操作符描述变换关系。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书 RxJS 示例代码" code={BOOK_CODE} />
    </div>
  );
}
