"use client";

import clsx from "clsx";
import { useCallback, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservable, useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { WithLatestFromDemoModel } from "./with-latest-from-demo.model";

const BOOK_CODE = `// 5.1.5 withLatestFrom
import { timer } from "rxjs";
import { map, withLatestFrom } from "rxjs/operators";

const source1$ = timer(0, 2000).pipe(map((x) => 100 * x));
const source2$ = timer(500, 1000);

const result$ = source1$.pipe(
  withLatestFrom(source2$, (a, b) => a + b),
);

result$.subscribe(console.log);
// 只有 source1$ 触发时才会输出，source2$ 只负责提供最新值`;

const BOOK_CODE_PIPE = `// 也可以先 withLatestFrom，再用 map 做输出定制
const result$ = source1$.pipe(
  withLatestFrom(source2$),
  map(([a, b]) => \`\${a} and \${b}\`),
);`;

export default function WithLatestFromPage() {
  const [demo] = useState(() => new WithLatestFromDemoModel());

  const title = useObservableState(demo.title$, () => demo.title);
  const channel = useObservableState(demo.channel$, () => demo.channel);
  const priority = useObservableState(demo.priority$, () => demo.priority);
  const status = useObservableState(demo.status$, () => demo.status);
  const records = useObservableState(demo.records$, () => demo.records);
  const running = useObservableState(demo.running$, () => demo.running);

  useObservable(demo.submitRecord$, (record) => {
    demo.publish(record);
  });

  const reset = useCallback(() => demo.reset(), [demo]);
  const submitCount = records.length;
  const latestRecord = records[records.length - 1];

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.5 withLatestFrom</h1>
        <p className={styles.subtitle}>withLatestFrom 和 combineLatest 很像，但它只由一个主流触发输出，其他流只提供“最新值”。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{status}</p>
            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={reset}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.formCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>Draft Form</h3>
                <span className={styles.cardMeta}>输入框持续变化，但不会单独触发提交</span>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>标题</span>
                <input className={styles.input} value={title} onChange={(e) => demo.setTitle(e.target.value)} placeholder="请输入标题" />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>发送渠道</span>
                <select className={styles.select} value={channel} onChange={(e) => demo.setChannel(e.target.value)}>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="Push">Push</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>优先级</span>
                <select className={styles.select} value={priority} onChange={(e) => demo.setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </label>
            </article>

            <article className={clsx(styles.card, styles.triggerCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>Submit Action</h3>
                <span className={styles.cardMeta}>点击按钮时，withLatestFrom 读取三路最新值</span>
              </div>

              <div className={styles.preview}>
                <div>
                  <span className={styles.previewLabel}>当前标题</span>
                  <div className={styles.previewValue}>{title}</div>
                </div>
                <div>
                  <span className={styles.previewLabel}>当前渠道</span>
                  <div className={styles.previewValue}>{channel}</div>
                </div>
                <div>
                  <span className={styles.previewLabel}>当前优先级</span>
                  <div className={styles.previewValue}>{priority}</div>
                </div>
              </div>

              <button className={styles.primaryBtn} onClick={() => demo.submit()}>
                提交并发布
              </button>

              <div className={styles.counterRow}>
                <span className={styles.badge}>已提交 {submitCount} 次</span>
                <span className={styles.badge}>{running ? "主流已接入" : "等待订阅"}</span>
              </div>
            </article>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>withLatestFrom 输出</span>
              <span className={styles.outputMeta}>只有提交按钮点击才会产生记录</span>
            </div>

            {records.length === 0 ? (
              <p className={styles.placeholder}>{"// 先改字段，再点提交，才会把最新快照组合出来"}</p>
            ) : (
              records.map((record, index) => (
                <div key={`${record.title}-${record.channel}-${record.priority}-${index}`} className={styles.outputLine}>
                  <span className={styles.outputItem}>
                    {record.title} / {record.channel} / {record.priority}
                  </span>
                </div>
              ))
            )}

            {latestRecord && (
              <div className={styles.latestBox}>
                最近一次提交：{latestRecord.title} / {latestRecord.channel} / {latestRecord.priority}
              </div>
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>主流驱动</strong>：只有主流发射时才会输出，辅流不会单独触发结果。
          </li>
          <li>
            <strong>辅流提供最新值</strong>：主流触发时，withLatestFrom 会拿辅流当前最后一次发出的值一起组合。
          </li>
          <li>
            <strong>适合提交/发送</strong>：按钮点击、表单提交、主动动作触发时携带最新表单状态，是最典型的应用场景。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="pipe + map 定制输出" code={BOOK_CODE_PIPE} />
    </div>
  );
}
