"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useMemo, useRef, useState } from "react";
import { concat, interval, map, Subscription, take } from "rxjs";

import styles from "./styles.module.scss";

type LogItem = {
  stream: "source1" | "source2" | "source3" | "system";
  value: string;
};

const SOURCES = [
  { key: "source1", label: "source1$", cardClass: "source1Card", tagClass: "source1Tag", interval: 500, count: 3, prefix: "A" },
  { key: "source2", label: "source2$", cardClass: "source2Card", tagClass: "source2Tag", interval: 240, count: 3, prefix: "B" },
  { key: "source3", label: "source3$", cardClass: "source3Card", tagClass: "source3Tag", interval: 180, count: 2, prefix: "C" },
] as const;

function buildSource(prefix: string, intervalMs: number, count: number, label: LogItem["stream"]) {
  return interval(intervalMs).pipe(
    take(count),
    map((index) => ({
      stream: label,
      value: `${prefix}${index + 1}`,
    })),
  );
}

export default function ConcatDemo() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [status, setStatus] = useState("点击运行，观察 concat 的顺序串联");
  const subRef = useRef<Subscription | null>(null);

  const sourceCards = useMemo(
    () =>
      SOURCES.map((source) => ({
        ...source,
        note: source.key === "source1" ? "先完成的流" : source.key === "source2" ? "更快，但必须等待 source1 完成" : "最后接力的流",
      })),
    [],
  );

  const reset = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setRunning(false);
    setLogs([]);
    setStatus("点击运行，观察 concat 的顺序串联");
  }, []);

  const run = useCallback(() => {
    subRef.current?.unsubscribe();
    setLogs([]);
    setRunning(true);
    setStatus("source1$ 订阅中");

    const source1$ = buildSource("A", 500, 3, "source1");
    const source2$ = buildSource("B", 240, 3, "source2");
    const source3$ = buildSource("C", 180, 2, "source3");

    const entries: LogItem[] = [];
    const startAt = Date.now();

    const stamp = () => `${Date.now() - startAt}ms`;

    subRef.current = concat(source1$, source2$, source3$).subscribe({
      next: (item) => {
        entries.push(item);
        setLogs([...entries]);

        if (item.stream === "source1" && item.value === "A1") {
          setStatus("source1$ 正在输出，source2$ 已创建但还没开始订阅");
        } else if (item.stream === "source1" && item.value === "A3") {
          setStatus("source1$ 已完成，开始订阅 source2$");
        } else if (item.stream === "source2" && item.value === "B1") {
          setStatus("source2$ 开始输出，但它之前一直在等待 source1$ complete");
        } else if (item.stream === "source3" && item.value === "C1") {
          setStatus("source3$ 接力开始，整个 concat 链继续顺序推进");
        }
      },
      complete: () => {
        entries.push({ stream: "system", value: `complete at ${stamp()}` });
        setLogs([...entries]);
        setStatus("concat 已完成：三个流按顺序串联结束");
        setRunning(false);
        subRef.current = null;
      },
      error: (error) => {
        entries.push({ stream: "system", value: `error: ${String(error)}` });
        setLogs([...entries]);
        setStatus("发生错误，串联终止");
        setRunning(false);
        subRef.current = null;
      },
    });
  }, []);

  useUnmount(() => {
    subRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={styles.header}>
        <p className={styles.summary}>{status}</p>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={run} disabled={running}>
            {running ? "运行中..." : "运行演示"}
          </button>
          <button className={styles.secondaryBtn} onClick={reset} disabled={running && logs.length === 0}>
            重置
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {sourceCards.map((source) => (
          <article key={source.key} className={clsx(styles.card, styles[source.cardClass])}>
            <div className={styles.cardTop}>
              <h3 className={styles.cardTitle}>{source.label}</h3>
              <span className={styles.cardMeta}>{source.note}</span>
            </div>
            <p className={styles.cardDesc}>
              以 <strong>{source.interval}ms</strong> 间隔吐出 <strong>{source.count}</strong> 个值，格式是 {source.prefix}1, {source.prefix}2...
            </p>
          </article>
        ))}
      </div>

      <div className={styles.output}>
        {logs.length === 0 ? (
          <p className={styles.placeholder}>{"// 运行后这里会显示 concat 的输出顺序"}</p>
        ) : (
          logs.map((item, index) => (
            <div key={`${item.stream}-${index}`} className={styles.line}>
              {item.stream === "system" ? (
                <span className={styles.systemLine}>{item.value}</span>
              ) : (
                <>
                  <span className={clsx(styles.streamTag, styles[`${item.stream}Tag`])}>{item.stream}</span>
                  <span className={styles.value}>{item.value}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
