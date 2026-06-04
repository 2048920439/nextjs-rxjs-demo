import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import FromDemo from "./_components/from-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.2 from：万物转Observable",
};

const BOOK_CODE = `// 4.3.2 from：可把一切转化为 Observable
import { from } from 'rxjs';

// 数组
const arr$ = from([1, 2, 3]);

// 字符串（每个字符一个数据）
const str$ = from('abc');  // 吐出 'a', 'b', 'c'

// Promise（4.3.3 fromPromise 同理）
const promise$ = from(Promise.resolve('good'));

// 已有 Observable（无意义但可行）
const another$ = from(of(1, 2, 3));`;

/**
 * 4.3.2 from — 《深入浅出RxJS》
 *
 * from 是创建类操作符中包容性最强的：数组、类数组、字符串、Promise、Generator、
 * 甚至已有 Observable 都能转为一个新的 Observable。
 */
export default function FromPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.2 from：可把一切转化为 Observable</h1>
        <p className={styles.subtitle}>包容性最强的创建操作符 — 数组、字符串、Promise、Generator 皆可转化</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <FromDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>数组</strong> — 每个元素依次吐出，顺序与数组一致。
          </li>
          <li>
            <strong>字符串</strong> — 被当作字符数组处理，<code>from(&apos;abc&apos;)</code> 吐出 &apos;a&apos;、&apos;b&apos;、&apos;c&apos;。
          </li>
          <li>
            <strong>Promise</strong> — resolve 时吐出结果并 complete；reject 时发出 error。 功能与 <code>fromPromise</code> 完全一致。
          </li>
          <li>
            <strong>Generator</strong> — 支持 ES6 Generator，通过 yield 逐值产生数据。
          </li>
          <li>
            <strong>类数组</strong> — 有 length 属性和下标访问的对象（如 arguments）也能被转化。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
