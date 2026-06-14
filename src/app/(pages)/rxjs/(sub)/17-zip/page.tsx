import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import ZipDemo from "./_components/zip-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "5.1.3 zip：拉链式组合",
};

const BOOK_CODE_SYNC = `// 5.1.3 zip：一对一配对
import { of, zip } from "rxjs";

const source1$ = of(1, 2, 3);
const source2$ = of("a", "b", "c");

const zipped$ = zip(source1$, source2$);

zipped$.subscribe(console.log);
// 输出：
// [1, "a"]
// [2, "b"]
// [3, "c"]`;

const BOOK_CODE_ASYNC = `// zip 也可以组合异步流
import { interval, zip } from "rxjs";
import { map, take } from "rxjs/operators";

const source1$ = interval(1000).pipe(take(3));
const source2$ = interval(1500).pipe(
  take(3),
  map((i) => String.fromCharCode(97 + i)),
);

const zipped$ = zip(source1$, source2$);

// 只有两边都各自准备好一个值时，zip 才会放行一个配对结果
// 如果某一边更快，剩余值会先进入缓冲区，等待另一边追上`;

export default function ZipPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.3 zip：拉链式组合</h1>
        <p className={styles.subtitle}>zip 的规则很简单：一对一配对。每个上游 Observable 提供一个值，凑齐一组后再一起发给下游。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ZipDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>严格配对</strong>：每个来源都必须提供一个值，zip 才会生成一个结果。
          </li>
          <li>
            <strong>快流会排队</strong>：更快到达的值不会丢失，而是先进入缓冲区，等待慢流补齐配对。
          </li>
          <li>
            <strong>短流决定总数</strong>：当某个上游结束后，zip 只能处理已经凑齐的那几组，剩余值会被丢弃。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例：同步配对" code={BOOK_CODE_SYNC} />
      <CodeBlock title="原书示例：异步配对" code={BOOK_CODE_ASYNC} />
    </div>
  );
}
