"use client";

import clsx from "clsx";
import { useCallback, useState } from "react";
import { generate, Observable, of, range } from "rxjs";

import styles from "./styles.module.scss";

type TabKey = "create" | "of" | "range" | "generate";

interface TabDef {
  key: TabKey;
  label: string;
  hint: string;
}

const TABS: TabDef[] = [
  { key: "create", label: "create", hint: "直接调用构造函数" },
  { key: "of", label: "of", hint: "列举任意数据" },
  { key: "range", label: "range", hint: "指定范围与长度" },
  { key: "generate", label: "generate", hint: "类似 for 循环" },
];

interface LogEntry {
  type: "next" | "complete" | "error";
  value?: string;
}

export default function SyncDemo() {
  const [activeTab, setActiveTab] = useState<TabKey>("of");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  const pushLog = useCallback((entries: LogEntry[]) => {
    setLogs(entries);
  }, []);

  const runTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      setRunning(true);
      const entries: LogEntry[] = [];

      try {
        let source$: Observable<unknown>;

        switch (tab) {
          case "create":
            source$ = new Observable((subscriber) => {
              subscriber.next(1);
              subscriber.next(2);
              subscriber.next(3);
              subscriber.complete();
            });
            break;
          case "of":
            source$ = of(1, 2, 3);
            break;
          case "range":
            source$ = range(1, 10);
            break;
          case "generate":
            source$ = generate<number, number>({
              initialState: 2,
              condition: (v) => v < 10,
              iterate: (v) => v + 2,
              resultSelector: (v) => v * v,
            });
            break;
        }

        source$.subscribe({
          next: (val) => entries.push({ type: "next", value: String(val) }),
          complete: () => {
            entries.push({ type: "complete" });
            pushLog(entries);
            setRunning(false);
          },
          error: (err) => {
            entries.push({ type: "error", value: String(err) });
            pushLog(entries);
            setRunning(false);
          },
        });
      } catch (err) {
        entries.push({ type: "error", value: String(err) });
        pushLog(entries);
        setRunning(false);
      }
    },
    [pushLog],
  );

  return (
    <section className={styles.demo}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button key={t.key} className={clsx(styles.tab, activeTab === t.key && styles.tabActive)} onClick={() => runTab(t.key)} disabled={running}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelTitle}>{TABS.find((t) => t.key === activeTab)?.label}</span>
            <span className={styles.panelHint}> — {TABS.find((t) => t.key === activeTab)?.hint}</span>
          </div>
          <button className={styles.triggerBtn} onClick={() => runTab(activeTab)} disabled={running}>
            {running ? "数据流进行中…" : "执行订阅"}
          </button>
        </div>

        <div className={styles.output}>
          {logs.length === 0 ? (
            <span className={styles.outputLabel}>{"// 点击上方按钮或标签页查看输出"}</span>
          ) : (
            logs.map((entry, i) => {
              if (entry.type === "next") {
                return (
                  <div key={i}>
                    <span className={styles.outputLabel}>next:</span>
                    <span className={styles.outputValue}>{entry.value}</span>
                  </div>
                );
              }
              if (entry.type === "complete") {
                return (
                  <div key={i}>
                    <span className={styles.outputComplete}>{"// complete — 数据流完结"}</span>
                  </div>
                );
              }
              return (
                <div key={i}>
                  <span className={styles.outputError}>
                    {"// error: "}
                    {entry.value}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
