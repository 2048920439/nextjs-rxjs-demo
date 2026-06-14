import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import MergeDemo from "./_components/merge-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "5.1.2 merge：先到先得快速通过",
};

const BOOK_CODE = `// 5.1.2 merge：先到先得快速通过
import { merge, timer } from "rxjs";
import { map } from "rxjs/operators";

const source1$ = timer(0, 1000).pipe(map((x) => \`\${x}A\`));
const source2$ = timer(500, 1000).pipe(map((x) => \`\${x}B\`));

const merged$ = merge(source1$, source2$);

merged$.subscribe(console.log);
// 输出会按实际到达时间交叉出现，而不是等第一个流 complete`;

const BOOK_CODE_SYNC = `// merge 也可以合并同步 Observable
import { merge, of } from "rxjs";

const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);

const merged$ = merge(source1$, source2$);

// 由于两个流都是同步吐出，
// 这里看上去会像 1, 2, 3, 4, 5, 6
// 但它的规则仍然是“同时订阅、谁先到谁先出”`;

export default function MergePage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.2 merge：先到先得快速通过</h1>
        <p className={styles.subtitle}>merge 和 concat 很像，但规则完全不同：它会立刻订阅所有上游 Observable，谁先产生数据就先转发给下游。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <MergeDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>同时订阅</strong>：merge 会一开始就订阅所有输入流，不会等前一个流 complete。
          </li>
          <li>
            <strong>先到先出</strong>：哪个流先产生值，哪个值就先进入输出流，顺序由时间决定，不由参数顺序决定。
          </li>
          <li>
            <strong>适合异步事件</strong>：比如 click、touchend、timer 这类本来就可能交叉发生的流，merge 很自然。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="同步流合并示例" code={BOOK_CODE_SYNC} />
    </div>
  );
}
