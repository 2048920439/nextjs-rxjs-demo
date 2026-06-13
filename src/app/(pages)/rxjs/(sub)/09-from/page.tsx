import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import FromDemo from "./_components/from-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.2 from：万物转 Observable",
};

const BOOK_CODE = `// 4.3.2 from：可以把一切转化为 Observable
import { from } from 'rxjs';

// 数组
const arr$ = from([1, 2, 3]);

// 字符串（每个字符都会作为一个值吐出）
const str$ = from('abc');  // 吐出 'a', 'b', 'c'

// Promise
const promise$ = from(Promise.resolve('good'));

// 已有 Observable
const another$ = from(of(1, 2, 3));`;

/**
 * 4.3.2 from — 《深入浅出RxJS》
 *
 * from 的核心就是：把数组、字符串、Promise、Generator、甚至已有 Observable
 * 统一变成 Observable，方便进入同一套数据流处理链路。
 */
export default function FromPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.2 from：万物转 Observable</h1>
        <p className={styles.subtitle}>把不同数据源统一包装成 Observable，进入同一套 RxJS 数据流</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <FromDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>数组</strong> 每个元素依次吐出，顺序和数组一致。
          </li>
          <li>
            <strong>字符串</strong> 会被当作字符序列处理，逐个字符吐出。
          </li>
          <li>
            <strong>Promise</strong> resolve 时吐出结果并 complete，reject 时发出 error。
          </li>
          <li>
            <strong>已有 Observable</strong> 也可以再次交给 from 处理，结果仍然是 Observable。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
