"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { DeferDemoModel } from "./defer-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `// 4.3.8 defer
import { defer, of } from 'rxjs';

const source$ = defer(() => {
  console.log('factory runs on subscribe');
  return of(new Date());
});

// 创建 Observable 时不会执行 factory
source$.subscribe(console.log);`;

export default function DeferPage() {
  const [demo] = useState(() => new DeferDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const handlePrimaryClick = useCallback(() => demo.handlePrimaryClick(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.8 defer：延迟创建 Observable</h1>
        <p className={styles.subtitle}>defer 把 Observable 的创建逻辑延迟到订阅时执行，适合把“当前时间、当前配置、当前请求参数”绑定到订阅瞬间。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>第一步只创建 deferred$，第二步订阅时才真正执行 factory。</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} type="button" onClick={handlePrimaryClick}>
                {demo.primaryLabel}
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <span className={styles.cardMeta}>创建时刻</span>
              <strong className={styles.cardValue}>{state.createdAt ?? "-"}</strong>
            </article>
            <article className={styles.card}>
              <span className={styles.cardMeta}>factory 调用次数</span>
              <strong className={styles.cardValue}>{state.factoryCount}</strong>
            </article>
            <article className={styles.card}>
              <span className={styles.cardMeta}>当前状态</span>
              <strong className={styles.cardValue}>{demo.statusText}</strong>
            </article>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>defer 输出</span>
              <span className={styles.outputMeta}>factory 只在 subscribe 时运行</span>
            </div>
            <p className={styles.placeholder}>
              <code>defer(() =&gt; of(订阅时的时间))</code>
            </p>
            {state.logs.length === 0 ? (
              <p className={styles.placeholder}>等待操作...</p>
            ) : (
              state.logs.map((line, index) => (
                <div key={`${line}-${index}`} className={styles.outputLine}>
                  {line}
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
            <strong>创建不执行</strong>：defer 返回 Observable，但不会立即运行 factory。
          </li>
          <li>
            <strong>订阅才执行</strong>：每次 subscribe 都会重新调用 factory。
          </li>
          <li>
            <strong>适合动态上下文</strong>：需要订阅瞬间读取时间、配置或参数时使用。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
