"use client";

import type { ReactNode } from "react";

import CodeBlock from "@/app/(components)/code-block";

import styles from "../_backpressure/backpressure-page.module.scss";

export type WindowBufferSourceValue = {
  value: number;
  at: string;
};

export type WindowBufferOutput = {
  label: string;
  values: string[];
  at: string;
};

export type WindowBufferDemoState = {
  running: boolean;
  status: string;
  operatorLabel: string;
  sourceValues: WindowBufferSourceValue[];
  outputs: WindowBufferOutput[];
};

type CodeBlockItem = {
  title: string;
  code: string;
};

type WindowBufferDemoPageProps = {
  title: string;
  subtitle: string;
  sourceMeta: string;
  resultTitle: string;
  resultMeta: string;
  runLabel?: string;
  state: WindowBufferDemoState;
  description: ReactNode;
  codeBlocks: CodeBlockItem[];
  onRun: () => void;
  onReset: () => void;
};

export function WindowBufferDemoPage({
  title,
  subtitle,
  sourceMeta,
  resultTitle,
  resultMeta,
  runLabel = "运行",
  state,
  description,
  codeBlocks,
  onRun,
  onReset,
}: WindowBufferDemoPageProps) {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={onRun} disabled={state.running}>
                {runLabel}
              </button>
              <button className={styles.secondaryBtn} onClick={onReset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.operatorLabel}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>{sourceMeta}</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={`${styles.token} ${styles.passToken}`}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>{resultTitle}</h3>
              <p className={styles.cardMeta}>{resultMeta}</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待窗口输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.label}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.label}</strong>
                      <code>{`[${item.values.join(", ")}]`}</code>
                      <span>{item.at}</span>
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
        <ul>{description}</ul>
      </aside>

      {codeBlocks.map((item) => (
        <CodeBlock key={item.title} title={item.title} code={item.code} />
      ))}
    </div>
  );
}
