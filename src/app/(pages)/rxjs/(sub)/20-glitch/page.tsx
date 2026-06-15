"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { GlitchDemoModel } from "./glitch-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 5.1.6 解决 glitch

const BOOK_CODE = `// 5.1.6 combineLatest 可能产生 glitch
import { combineLatest, fromEvent } from "rxjs";
import { map } from "rxjs/operators";

const target = document.querySelector("#glitch-area");
const event$ = fromEvent(target, "pointerdown");
const point$ = event$.pipe(
  map((event) => ({
    x: event.offsetX,
    y: event.offsetY,
  })),
);
const x$ = point$.pipe(map((point) => point.x));
const y$ = point$.pipe(map((point) => point.y));

const result$ = combineLatest([x$, y$]).pipe(
  map(([x, y]) => \`x: \${x}, y: \${y}\`),
);

result$.subscribe((location) => {
  console.log("#render", location);
});`;

const FIX_CODE = `// 当 x$ 和 y$ 都来自同一个 event$ 时，用 withLatestFrom 控制输出节奏
const result$ = x$.pipe(
  withLatestFrom(y$),
  map(([x, y]) => \`x: \${x}, y: \${y}\`),
);

// 输出节奏只跟随 x$，每次点击只产生一次渲染。`;

export default function GlitchPage() {
  const [demo] = useState(() => new GlitchDemoModel());
  const clickAreaRef = useRef<HTMLDivElement>(null);
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => {
    const clickArea = clickAreaRef.current;

    if (!clickArea) return undefined;

    const detachClickTarget = demo.attachClickTarget(clickArea);

    return () => {
      detachClickTarget();
      demo.dispose();
    };
  }, [demo]);

  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.6 解决 glitch</h1>
        <p className={styles.subtitle}>
          当多个输入流都由同一个事件源派生时，combineLatest 可能在一次事件里输出旧值和新值的中间态；withLatestFrom
          可以让输出节奏只跟随一个主流，从而避免多余渲染。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={reset}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.currentBox}>
            <span className={styles.badge}>点击次数 {state.clickCount}</span>
            <span className={styles.badge}>当前坐标 {state.latestPoint ? `${state.latestPoint.x}, ${state.latestPoint.y}` : "暂无"}</span>
          </div>

          <div ref={clickAreaRef} id="glitch-area" className={styles.clickArea}>
            <div className={styles.clickGrid} />
            <span className={styles.clickHint}>在这里点击，真实 pointerdown 事件会进入 event$</span>
            {state.latestPoint && (
              <span
                className={styles.clickMarker}
                style={{
                  left: state.latestPoint.x,
                  top: state.latestPoint.y,
                }}
              />
            )}
          </div>

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.glitchCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>combineLatest([x$, y$])</h3>
                <span className={styles.cardMeta}>第二次点击开始，可能先输出新 x + 旧 y</span>
              </div>
              <div className={styles.output}>
                {state.combineLatestLogs.length === 0 ? (
                  <p className={styles.placeholder}>{"// 等待点击坐标"}</p>
                ) : (
                  state.combineLatestLogs.map((log) => (
                    <div key={`combine-${log.render}`} className={clsx(styles.outputLine, log.stale && styles.staleLine)}>
                      <span className={styles.renderTag}>#{log.render}</span>
                      <span>{log.value}</span>
                      {log.stale && <span className={styles.warnTag}>旧值中间态</span>}
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className={clsx(styles.card, styles.fixedCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>x$.pipe(withLatestFrom(y$))</h3>
                <span className={styles.cardMeta}>只由 x$ 触发输出，每次点击对应一次渲染</span>
              </div>
              <div className={styles.output}>
                {state.withLatestFromLogs.length === 0 ? (
                  <p className={styles.placeholder}>{"// 等待点击坐标"}</p>
                ) : (
                  state.withLatestFromLogs.map((log) => (
                    <div key={`with-${log.render}`} className={styles.outputLine}>
                      <span className={styles.renderTag}>#{log.render}</span>
                      <span>{log.value}</span>
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
            <strong>glitch 来自依赖关系</strong>：x$ 和 y$ 都从同一个 event$ 派生，combineLatest 会分别响应两路 next。
          </li>
          <li>
            <strong>combineLatest 不一定错</strong>：它适合合并独立来源，但依赖同源事件时可能产生多余中间态。
          </li>
          <li>
            <strong>withLatestFrom 控制节奏</strong>：选择一个主流驱动输出，其余流只提供最新值。
          </li>
        </ul>
      </aside>

      <CodeBlock title="combineLatest 版本" code={BOOK_CODE} />
      <CodeBlock title="withLatestFrom 修正" code={FIX_CODE} />
    </div>
  );
}
