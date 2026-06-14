"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { AjaxDemoModel } from "./ajax-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `// 4.3.6 ajax
import { ajax } from 'rxjs/ajax';

ajax.getJSON('/api/mock/delay?ms=1500').subscribe({
  next: console.log,
  error: console.error,
});`;

export default function AjaxPage() {
  const [demo] = useState(() => new AjaxDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const fetch = useCallback(() => demo.fetch(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.6 ajax：把 HTTP 请求变成 Observable</h1>
        <p className={styles.subtitle}>rxjs/ajax 会把请求、响应、错误都纳入 Observable 管线，订阅负责启动请求，退订可以取消仍在进行的请求。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>请求项目内 mock 接口：/api/mock/delay?ms={state.delayMs}</p>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span>延迟(ms)</span>
                <input
                  type="number"
                  className={styles.input}
                  value={state.delayMs}
                  min={100}
                  max={10000}
                  step={100}
                  onChange={(event) => demo.setDelay(Number(event.target.value) || 1500)}
                  disabled={state.loading}
                />
              </label>
              <button className={styles.primaryBtn} onClick={fetch} disabled={state.loading}>
                {state.loading ? "请求中..." : "发送请求"}
              </button>
            </div>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>ajax.getJSON 输出</span>
              <span className={styles.outputMeta}>Observable HTTP response</span>
            </div>
            {state.loading && <p className={styles.placeholder}>正在请求 /api/mock/delay...</p>}
            {state.error && <p className={styles.errorMsg}>{state.error}</p>}
            {state.result && (
              <div className={styles.resultBox}>
                <strong>{state.result.delay}ms</strong>
                <span>
                  服务端延迟 {state.result.delay}ms 后返回，结果为 {state.result.success ? "成功" : "失败"}
                </span>
              </div>
            )}
            {!state.loading && !state.error && !state.result && <p className={styles.placeholder}>点击“发送请求”查看 ajax 行为</p>}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>订阅启动请求</strong>：Observable 创建后不会立即请求，subscribe 时才会发起 HTTP。
          </li>
          <li>
            <strong>响应进入 next</strong>：成功响应会作为数据进入下游。
          </li>
          <li>
            <strong>错误进入 error</strong>：网络或服务端错误可以在 Observable 链中统一处理。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
