"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { MinimalDemoModel } from "./minimal-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `import { EMPTY, NEVER, throwError } from 'rxjs';

EMPTY.subscribe({ complete: () => console.log('complete') });
NEVER.subscribe(); // no next, no complete, no error
throwError(() => new Error('Oops')).subscribe({ error: console.error });`;

export default function EmptyNeverThrowPage() {
  const [demo] = useState(() => new MinimalDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const subscribeEmpty = useCallback(() => demo.subscribeEmpty(), [demo]);
  const subscribeNever = useCallback(() => demo.subscribeNever(), [demo]);
  const cancelNever = useCallback(() => demo.cancelNever(), [demo]);
  const subscribeThrow = useCallback(() => demo.subscribeThrow(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2.6 EMPTY、NEVER、throwError</h1>
        <p className={styles.subtitle}>这三个创建类 Observable 都不产生普通数据，但它们分别代表立即完成、永不结束、立即出错。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>EMPTY</h3>
            <p className={styles.cardDesc}>不产生数据，直接 complete。</p>
            <button className={styles.primaryBtn} onClick={subscribeEmpty}>
              订阅 EMPTY
            </button>
            <div className={clsx(styles.result, styles[state.empty.result])}>{state.empty.message}</div>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>NEVER</h3>
            <p className={styles.cardDesc}>不产生数据、不结束、不出错。</p>
            {state.never.result === "waiting" ? (
              <button className={styles.secondaryBtn} onClick={cancelNever}>
                取消订阅
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={subscribeNever}>
                订阅 NEVER
              </button>
            )}
            <div className={clsx(styles.result, styles[state.never.result])}>{state.never.message}</div>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>throwError</h3>
            <p className={styles.cardDesc}>不产生数据，直接 error。</p>
            <button className={styles.primaryBtn} onClick={subscribeThrow}>
              订阅 throwError
            </button>
            <div className={clsx(styles.result, styles[state.thrown.result])}>{state.thrown.message}</div>
          </article>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>EMPTY</strong>：立刻 complete。
          </li>
          <li>
            <strong>NEVER</strong>：既不发值，也不结束。
          </li>
          <li>
            <strong>throwError</strong>：立刻进入 error 分支。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
