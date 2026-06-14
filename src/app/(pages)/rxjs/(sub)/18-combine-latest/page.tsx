import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import CombineLatestDemo from "./_components/combine-latest-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "5.1.4 combineLatest：合并最后一个数据",
};

const BOOK_CODE = `// 5.1.4 combineLatest：合并最后一个数据
import { combineLatest, timer } from "rxjs";
import { map } from "rxjs/operators";

const source1$ = timer(500, 1000).pipe(map((x) => x + "A"));
const source2$ = timer(1000, 1000).pipe(map((x) => x + "B"));

const result$ = combineLatest([source1$, source2$]);

result$.subscribe(console.log);
// 每当任意一个源更新，就拿所有源的最新值重新组合一次`;

const BOOK_CODE_PROJECT = `// combineLatest 也可以直接做输出映射
import { combineLatest, timer } from "rxjs";
import { map } from "rxjs/operators";

const source1$ = timer(500, 1000).pipe(map((x) => x + "A"));
const source2$ = timer(1000, 1000).pipe(map((x) => x + "B"));

const result$ = combineLatest([source1$, source2$]).pipe(
  map(([a, b]) => \`\${a} and \${b}\`),
);`;

export default function CombineLatestPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.4 combineLatest：合并最后一个数据</h1>
        <p className={styles.subtitle}>combineLatest 不是按位置配对，而是“只要有一个源更新，就把所有源的最新值重新组合起来”。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <CombineLatestDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>最新快照</strong>：任何一个输入流发射新值，输出都会用它和其他流的最新值一起更新。
          </li>
          <li>
            <strong>先等齐再发</strong>：只要还有一个输入流没发过值，combineLatest 就不会输出。
          </li>
          <li>
            <strong>适合联动 UI</strong>：表单摘要、天气面板、筛选条件组合，这类“任一项变动就重算整体”的场景最常见。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="使用 project/map 定制输出" code={BOOK_CODE_PROJECT} />
    </div>
  );
}
