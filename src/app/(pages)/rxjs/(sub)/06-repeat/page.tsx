import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import RepeatDemo from "./_components/repeat-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.2.5 repeat：重复数据流",
};

const BOOK_CODE = `// 4.2.5 repeat：重复上游 Observable 的数据若干次
import { of } from 'rxjs';
import { repeat } from 'rxjs/operators';

const source$ = of(1, 2, 3);
const repeated$ = source$.pipe(repeat(10));
// 输出：1, 2, 3, 1, 2, 3, ... 共 30 个数据`;

const BOOK_CODE_TIMED = `// 带延时的 repeat 示例（展示 subscribe/unsubscribe 日志）
const source$ = new Observable(observer => {
  console.log('on subscribe');
  setTimeout(() => observer.next(1), 1000);
  setTimeout(() => observer.next(2), 2000);
  setTimeout(() => observer.next(3), 3000);
  setTimeout(() => observer.complete(), 4000);

  return {
    unsubscribe: () => console.log('on unsubscribe')
  };
});

const repeated$ = source$.pipe(repeat(2));
// 输出：
// on subscribe → 1 → 2 → 3 → on unsubscribe
// → on subscribe → 1 → 2 → 3 → complete → on unsubscribe`;

/**
 * 4.2.5 repeat — 《深入浅出RxJS》
 *
 * repeat 是创建类操作符中少有的实例操作符。
 * 它会在上游 Observable 完结后重新订阅上游，重复指定次数。
 * 关键：上游必须完结，否则 repeat 无法触发重复。
 */
export default function RepeatPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2.5 repeat：重复数据的数据流</h1>
        <p className={styles.subtitle}>
          实例操作符 — 上游完结后<strong>重新订阅</strong>，重复 N 次；上游不结束则 repeat 无意义
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <RepeatDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>实例操作符</strong> — 与 of、range 等静态操作符不同，repeat 通过 <code>.pipe(repeat(n))</code> 调用。
          </li>
          <li>
            <strong>依赖上游完结</strong> — repeat 只有在收到 <code>complete</code> 事件后才会退订并重新订阅。 如果上游永不完结，repeat 永远没有机会触发重复。
          </li>
          <li>
            <strong>每次重复 = 新的订阅</strong> — 重复 N 次意味着上游被 subscribe 了 N 次， 也会被 unsubscribe N-1 次（最后一次伴随 complete）。
          </li>
          <li>
            <strong>不传参数 = 无限重复</strong> — <code>repeat()</code> 或 <code>repeat(-1)</code> 代表无限次重复。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 — 同步 source$" code={BOOK_CODE} />
      <CodeBlock title="原书示例 — 延时 source$ 展示 subscribe/unsubscribe" code={BOOK_CODE_TIMED} />
    </div>
  );
}
