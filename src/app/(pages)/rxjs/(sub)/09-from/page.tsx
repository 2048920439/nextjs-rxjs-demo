"use client";

import { useMemo, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { type FromCaseKey, FromDemoModel, type OutputLine } from "./from-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `import { from, of } from 'rxjs';

from([1, 2, 3]).subscribe(console.log);
from('abc').subscribe(console.log);
from(Promise.resolve('good')).subscribe(console.log);
from(of(1, 2, 3)).subscribe(console.log);`;

function Output({ lines }: { lines: OutputLine[] }) {
  return (
    <div className={styles.output}>
      {lines.map((line, index) =>
        line.complete ? (
          <div key={index} className={styles.complete}>
            {"// complete - 数据流完结"}
          </div>
        ) : (
          <div key={index} className={styles.outputLine}>
            <span className={styles.outputLabel}>{line.label}</span>
            {line.value && <span className={styles.outputValue}>{line.value}</span>}
          </div>
        ),
      )}
    </div>
  );
}

export default function FromPage() {
  const [demo] = useState(() => new FromDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  const cards = useMemo(
    () =>
      [
        { key: "array", title: "数组", code: "from([1, 2, 3])", buttons: [{ label: "执行", action: () => demo.runArray() }] },
        { key: "string", title: "字符串", code: "from('abc')", buttons: [{ label: "执行", action: () => demo.runString() }] },
        {
          key: "promise",
          title: "Promise",
          code: "from(Promise.resolve('good'))",
          buttons: [
            { label: "resolve", action: () => demo.resolvePromise() },
            { label: "reject", action: () => demo.rejectPromise() },
          ],
        },
        { key: "observable", title: "已有 Observable", code: "from(of(1, 2, 3))", buttons: [{ label: "执行", action: () => demo.runObservable() }] },
      ] satisfies { key: FromCaseKey; title: string; code: string; buttons: { label: string; action: () => void }[] }[],
    [demo],
  );

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.2 from：把多种输入转换成 Observable</h1>
        <p className={styles.subtitle}>from 可以接收数组、字符串、Promise、已有 Observable 等输入，并按各自语义转成 Observable 输出。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          {cards.map((card) => (
            <article key={card.key} className={styles.card}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <code className={styles.cardName}>{card.code}</code>
              <div className={styles.triggers}>
                {card.buttons.map((button) => (
                  <button key={button.label} className={styles.primaryBtn} onClick={button.action} disabled={state.running}>
                    {button.label}
                  </button>
                ))}
              </div>
              <Output lines={state.outputs[card.key]} />
            </article>
          ))}
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>数组/字符串</strong>：逐项同步发射。
          </li>
          <li>
            <strong>Promise</strong>：resolve 进入 next，reject 进入 error。
          </li>
          <li>
            <strong>Observable</strong>：from 会直接接收并转发已有 Observable。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
