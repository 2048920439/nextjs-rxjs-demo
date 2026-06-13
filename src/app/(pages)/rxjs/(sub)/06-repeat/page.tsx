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

const BOOK_CODE_TIMED = `// 带延时的 repeat 示例（展示 subscribe / unsubscribe 日志）
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
// 输出：on subscribe → 1 → 2 → 3 → on unsubscribe
//       on subscribe → 1 → 2 → 3 → complete → on unsubscribe`;

/**
 * 4.2.5 repeat — 《深入浅出RxJS》
 *
 * repeat 的关键是：上游 complete 之后，重新订阅上游。
 * 所以这一页重点展示“重复订阅”这件事，而不是单纯重复输出文本。
 */
export default function RepeatPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2.5 repeat：重复数据流</h1>
        <p className={styles.subtitle}>上游 complete 之后才会再次订阅，repeat 关注的是“重新订阅”而不是简单复制结果</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <RepeatDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>实例操作符</strong> repeat 通过 <code>.pipe(repeat(n))</code> 使用。
          </li>
          <li>
            <strong>依赖 complete</strong> 只有上游结束后，repeat 才会再次订阅。
          </li>
          <li>
            <strong>每次重复都是新订阅</strong> 你会看到上游的 subscribe / unsubscribe 被反复触发。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 - 同步 source$" code={BOOK_CODE} />
      <CodeBlock title="原书示例 - 带日志的 source$" code={BOOK_CODE_TIMED} />
    </div>
  );
}
