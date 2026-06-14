"use client";

import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { SyncDemoModel, type SyncTabKey } from "./sync-demo.model";

const TABS: { key: SyncTabKey; label: string; hint: string }[] = [
  { key: "create", label: "create", hint: "直接调用构造函数" },
  { key: "of", label: "of", hint: "列举任意数据" },
  { key: "range", label: "range", hint: "指定范围与长度" },
  { key: "generate", label: "generate", hint: "类似 for 循环" },
];

const BOOK_CODE = `import { Observable, of, range, generate } from 'rxjs';

of(1, 2, 3).subscribe(console.log);
range(1, 10).subscribe(console.log);`;

export default function SyncCreationPage() {
  const [demo] = useState(() => new SyncDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  const activeTab = useMemo(() => TABS.find((tab) => tab.key === state.activeTab) ?? TABS[0], [state.activeTab]);
  const run = useCallback((tab?: SyncTabKey) => demo.run(tab), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2 同步创建类 Observable</h1>
        <p className={styles.subtitle}>create、of、range、generate 都会在订阅时同步吐出数据，适合描述有限、可立即生成的数据序列。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={clsx(styles.tab, state.activeTab === tab.key && styles.tabActive)}
                onClick={() => run(tab.key)}
                disabled={state.running}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>{activeTab.label}</span>
              <span className={styles.outputMeta}>{activeTab.hint}</span>
              <button className={styles.primaryBtn} onClick={() => run()} disabled={state.running}>
                {state.running ? "数据流进行中..." : "执行订阅"}
              </button>
            </div>

            {state.logs.length === 0 ? (
              <p className={styles.placeholder}>{"// 点击上方按钮或标签页查看输出"}</p>
            ) : (
              state.logs.map((entry, index) => {
                if (entry.type === "complete") {
                  return (
                    <div key={index} className={styles.complete}>
                      {"// complete - 数据流完结"}
                    </div>
                  );
                }
                if (entry.type === "error") {
                  return (
                    <div key={index} className={styles.error}>
                      {"// error: "}
                      {entry.value}
                    </div>
                  );
                }
                return (
                  <div key={index} className={styles.outputLine}>
                    <span className={styles.outputLabel}>next:</span>
                    <span className={styles.outputValue}>{entry.value}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>订阅即执行</strong>：同步创建类 Observable 会在 subscribe 调用栈内完成输出。
          </li>
          <li>
            <strong>有限序列</strong>：of/range/generate 常用于有限数据序列。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
