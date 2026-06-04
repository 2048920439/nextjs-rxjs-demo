import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import MinimalDemo from "./_components/minimal-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.2.6 极简操作符：empty、never与throw",
};

const BOOK_CODE = `// 4.2.6 empty、never、throw — 三个极简操作符
import { EMPTY, NEVER, throwError } from 'rxjs';

// empty：不产数据，直接 complete
const empty$ = EMPTY;           // 直接完结

// throwError：不产数据，直接 error
const error$ = throwError(      // 立即抛出错误
  () => new Error('Oops')
);

// never：什么都不做，永远不动
const never$ = NEVER;           // 永不完结`;

const BOOK_CODE_USAGE = `// 配合 concat 条件使用
import { concatWith, EMPTY, throwError } from 'rxjs';

const shouldEndWell = true;
const result$ = source$.pipe(
  concatWith(shouldEndWell ? EMPTY : throwError(() => new Error()))
);`;

/**
 * 4.2.6 empty、never、throw — 《深入浅出RxJS》
 *
 * 三个极简操作符，单独使用无意义，但在组合 Observable 时非常有用：
 * 作为默认值、占位符或条件分支中的终结点。
 */
export default function EmptyNeverThrowPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.2.6 极简操作符：empty、never 与 throwError</h1>
        <p className={styles.subtitle}>不产数据的特殊 Observable — 分别立即完结、永远等待、立即出错</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <MinimalDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>EMPTY</strong> — 订阅后立即触发 <code>complete</code>，不吐出任何数据。 弹珠图：一条竖线，无数据点。
          </li>
          <li>
            <strong>NEVER</strong> — 什么都不做：不 next、不 complete、不 error。直到取消订阅， 否则永远等待。常用于测试或占位。
          </li>
          <li>
            <strong>throwError</strong> — 订阅后立即触发 <code>error</code>，参数为错误对象。 因 <code>throw</code> 是 JS 关键字，独立导入时使用{" "}
            <code>throwError</code>。
          </li>
          <li>
            <strong>应用场景</strong> — 在组合 Observable 时作为条件分支的终结点， 如 <code>concatWith(condition ? EMPTY : throwError(...))</code>。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 — 三个极简操作符" code={BOOK_CODE} />
      <CodeBlock title="应用示例 — 配合 concat 条件使用" code={BOOK_CODE_USAGE} />
    </div>
  );
}
