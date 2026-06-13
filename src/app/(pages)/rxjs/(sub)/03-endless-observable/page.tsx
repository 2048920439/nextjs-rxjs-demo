import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import EndlessCounter from "./_components/endless-counter";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "2.2.5 永无止境的Observable",
};

const BOOK_CODE = `const onSubscribe = observer => {
  let number = 1;
  const handle = setInterval(() => {
    observer.next(number++);
  }, 1000);
};

// 用 onSubscribe 函数创建 Observable
const source$ = new Observable(onSubscribe);

// subscribe 将 Observer 和 Observable 连接起来
source$.subscribe(console.log);`;

/**
 * 2.2.5 永无止境的 Observable — 《深入浅出RxJS》
 *
 * 这一章强调的是：Observable 可以持续发出数据，但它不会自己结束。
 * 何时停止，通常要靠 complete、error 或 unsubscribe。
 */
export default function EndlessObservablePage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.2.5 永无止境的 Observable</h1>
        <p className={styles.subtitle}>数据可以持续发出，订阅者会持续接收，直到手动取消订阅</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <EndlessCounter />
      </section>

      <aside className={styles.description}>
        <h3>重点</h3>
        <ul>
          <li>
            <strong>无限流</strong> 只要上游不 complete，Observable 就可以一直发数据。
          </li>
          <li>
            <strong>不会自动堆积</strong> 数据是按到达顺序被 Observer 消费的，不需要先攒成数组。
          </li>
          <li>
            <strong>手动停止</strong> 真实场景里通常用 <code>unsubscribe()</code> 释放资源。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例代码" code={BOOK_CODE} />
    </div>
  );
}
