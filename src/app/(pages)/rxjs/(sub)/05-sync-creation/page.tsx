import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import SyncDemo from "./_components/sync-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.2 同步创建操作符：create、of、range与generate",
};

const BOOK_CODE_CREATE = `// 4.2.1 create：直接调用 Observable 构造函数
const source$ = Observable.create(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});`;

const BOOK_CODE_OF = `// 4.2.2 of：列举数据
import { of } from 'rxjs';

const source$ = of(1, 2, 3);
// source$ 被订阅时同步吐出 1, 2, 3，然后 complete`;

const BOOK_CODE_RANGE = `// 4.2.3 range：指定范围
import { range } from 'rxjs';

const source$ = range(1, 100);  // 从 1 开始，共 100 个
const source2$ = range(1.5, 3); // 从 1.5 开始，吐出 1.5, 2.5, 3.5`;

const BOOK_CODE_GENERATE = `// 4.2.4 generate：循环创建（类似 for 循环）
import { generate } from 'rxjs';

// 产生比 10 小的所有偶数的平方
const source$ = generate({
  initialState: 2,
  condition: v => v < 10,
  iterate: v => v + 2,
  resultSelector: v => v * v,
});
// 输出：4, 16, 36, 64`;

/**
 * 4.2 同步创建操作符 — 《深入浅出RxJS》
 *
 * create、of、range、generate 均以同步方式吐出数据，
 * 没有时间间隔，一口气将所有数据推给 Observer 后立刻完结。
 */
export default function SyncCreationPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2 同步创建操作符</h1>
        <p className={styles.subtitle}>
          create、of、range、generate — 所有数据<strong>同步</strong>吐出，无时间间隔，一口气推给 Observer 后立刻完结
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <SyncDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>create</strong> — 本质上就是 <code>new Observable(subscriber)</code>，没有神奇之处。 适合简单直观地创建
            Observable，但绝大多数场景用其他操作符组合即可。
          </li>
          <li>
            <strong>of</strong> — 按参数顺序同步吐出数据，然后立刻 <code>complete</code>。产生的是 Cold Observable，每个 Observer 独立收到完整序列。
          </li>
          <li>
            <strong>range</strong> — 指定起始值和长度，同步吐出连续整数序列。步长固定为 1， 如需定制步长可组合 <code>map</code> 或改用 <code>generate</code>。
          </li>
          <li>
            <strong>generate</strong> — 类似 for 循环：初始值、继续条件、递增值、结果映射。 可产生非数值序列（如字符串），是同步创建中最灵活的操作符。
          </li>
        </ul>
      </aside>

      <CodeBlock title="4.2.1 create — 原书示例" code={BOOK_CODE_CREATE} />
      <CodeBlock title="4.2.2 of — 原书示例" code={BOOK_CODE_OF} />
      <CodeBlock title="4.2.3 range — 原书示例" code={BOOK_CODE_RANGE} />
      <CodeBlock title="4.2.4 generate — 原书示例" code={BOOK_CODE_GENERATE} />
    </div>
  );
}
