import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import ConcatDemo from "./_components/concat-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "5.1.1 concat：首尾相连",
};

const BOOK_CODE = `// 5.1.1 concat：首尾相连
import { concat, of } from 'rxjs';

const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);
const concated$ = concat(source1$, source2$);

concated$.subscribe(console.log);
// 输出：1, 2, 3, 4, 5, 6
// 注意：第二个流必须等第一个流 complete 后才会开始`;

const BOOK_CODE_MORE = `// concat 可以连接任意多个 Observable
const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);
const source3$ = of(7, 8, 9);

const concated$ = concat(source1$, source2$, source3$);

// 如果前一个 Observable 永远不 complete，
// 那么后面的 Observable 永远没有机会被订阅`;

export default function ConcatPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.1 concat：首尾相连</h1>
        <p className={styles.subtitle}>
          concat 的核心规则只有一条：前一个流 complete 之后，才会订阅下一个流。看起来像“拼接数组”，实际是“按完成顺序串联 Observable”。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ConcatDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>顺序订阅</strong>：concat 会先把第一个 Observable 的数据完整转发给下游，等它 complete 之后，再开始第二个。
          </li>
          <li>
            <strong>不会并行合并</strong>：即使后面的流更快，也不会抢先输出。它强调的是“先后顺序”，不是“谁先到谁先出”。
          </li>
          <li>
            <strong>依赖 complete</strong>：如果前一个流不结束，后面的流就永远没有机会被订阅。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="多个流串联与注意事项" code={BOOK_CODE_MORE} />
    </div>
  );
}
