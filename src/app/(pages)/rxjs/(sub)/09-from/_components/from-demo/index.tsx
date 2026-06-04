"use client";

import { useCallback, useState } from "react";
import { from, of } from "rxjs";

import styles from "./styles.module.scss";

type OutputLine = { label: string; value?: string; complete?: boolean };

interface DemoCard {
  title: string;
  code: string;
  buttons: { label: string; action: () => void }[];
  output: OutputLine[];
}

/**
 * 4.3.2 from 交互演示
 *
 * 四张卡片展示 from 将不同数据源转为 Observable：数组、字符串、Promise、已有 Observable。
 */
export default function FromDemo() {
  const [running, setRunning] = useState(false);

  const [arrOut, setArrOut] = useState<OutputLine[]>([{ label: "// 点击按钮查看输出" }]);
  const [strOut, setStrOut] = useState<OutputLine[]>([{ label: "// 点击按钮查看输出" }]);
  const [promOut, setPromOut] = useState<OutputLine[]>([{ label: "// 点击按钮查看输出" }]);
  const [obsOut, setObsOut] = useState<OutputLine[]>([{ label: "// 点击按钮查看输出" }]);

  const run = useCallback((fn: () => OutputLine[], setter: (v: OutputLine[]) => void) => {
    setRunning(true);
    const entries = fn();
    setter(entries);
    setRunning(false);
  }, []);

  const cards: DemoCard[] = [
    {
      title: "数组",
      code: "from([1, 2, 3])",
      buttons: [
        {
          label: "执行",
          action: () =>
            run(() => {
              const lines: OutputLine[] = [];
              from([1, 2, 3]).subscribe({
                next: (v) => lines.push({ label: "next:", value: String(v) }),
                complete: () => lines.push({ label: "//", complete: true }),
              });
              return lines;
            }, setArrOut),
        },
      ],
      output: arrOut,
    },
    {
      title: "字符串",
      code: "from('abc')",
      buttons: [
        {
          label: "执行",
          action: () =>
            run(() => {
              const lines: OutputLine[] = [];
              from("abc").subscribe({
                next: (v) => lines.push({ label: "next:", value: String(v) }),
                complete: () => lines.push({ label: "//", complete: true }),
              });
              return lines;
            }, setStrOut),
        },
      ],
      output: strOut,
    },
    {
      title: "Promise",
      code: "from(Promise.resolve('good'))",
      buttons: [
        {
          label: "resolve",
          action: () => {
            setRunning(true);
            setPromOut([]);
            from(Promise.resolve("good")).subscribe({
              next: (v) => setPromOut((prev) => [...prev, { label: "next:", value: String(v) }]),
              complete: () => {
                setPromOut((prev) => [...prev, { label: "//", complete: true }]);
                setRunning(false);
              },
            });
          },
        },
        {
          label: "reject",
          action: () => {
            setRunning(true);
            setPromOut([]);
            from(Promise.reject("oops")).subscribe({
              error: (e) => {
                setPromOut([{ label: "catch:", value: String(e) }]);
                setRunning(false);
              },
            });
          },
        },
      ],
      output: promOut,
    },
    {
      title: "已有 Observable",
      code: "from(of(1, 2, 3))",
      buttons: [
        {
          label: "执行",
          action: () =>
            run(() => {
              const lines: OutputLine[] = [];
              from(of(1, 2, 3)).subscribe({
                next: (v) => lines.push({ label: "next:", value: String(v) }),
                complete: () => lines.push({ label: "//", complete: true }),
              });
              return lines;
            }, setObsOut),
        },
      ],
      output: obsOut,
    },
  ];

  return (
    <section className={styles.demo}>
      {cards.map((card) => (
        <div key={card.title} className={styles.card}>
          <h3 className={styles.cardTitle}>{card.title}</h3>
          <span className={styles.cardName}>{card.code}</span>
          <div className={styles.triggers}>
            {card.buttons.map((btn) => (
              <button key={btn.label} className={styles.triggerBtn} onClick={btn.action} disabled={running}>
                {btn.label}
              </button>
            ))}
          </div>
          <div className={styles.output}>
            {card.output.map((line, i) =>
              line.complete ? (
                <div key={i}>
                  <span className={styles.outputComplete}>{"// complete — 数据流完结"}</span>
                </div>
              ) : (
                <div key={i}>
                  <span className={styles.outputLabel}>{line.label}</span>
                  {line.value && <span className={styles.outputValue}>{line.value}</span>}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
