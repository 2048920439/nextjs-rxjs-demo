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

// subscribe 将 Observer 与 Observable 连接，启动数据流
source$.subscribe(console.log);`;

/**
 * 2.2.5 永无止境的 Observable — 《深入浅出RxJS》
 *
 * Observable 可以产生无限多的数据。
 * 与数组不同，数据不会被堆积，每次只吐出一个值并被 Observer 立即消化，
 * 因此即使数据流永不终止，也不会消耗更多内存。
 */
export default function EndlessObservablePage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.2.5 永无止境的 Observable</h1>
        <p className={styles.subtitle}>
          Observable 可以产生无限多的数据 — 数据随产生随消费，<strong>不会堆积</strong>
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <EndlessCounter />
      </section>

      <aside className={styles.description}>
        <h3>永无止境 vs 有限数据</h3>
        <ul>
          <li>
            <strong>Observable 不会堆积数据</strong> — 每秒只吐出一个值，Observer 立即消费，
            无论运行多久都不会消耗更多内存。这与把所有数据先装入数组再处理的方式截然不同。
          </li>
          <li>
            <strong>现实中常见无限流</strong> — 网页元素的 <code>click</code> 事件流、 WebSocket 消息流、传感器数据流……在程序运行期间这些数据流始终存在，
            直到关闭页面或主动取消订阅。
          </li>
          <li>
            <strong>需要明确的终止信号</strong> — 即使 Observable 停止吐数据， Observer 仍时刻等待。必须通过 <code>complete()</code> 或{" "}
            <code>unsubscribe()</code> 终止数据流并释放资源（见 2.2.6 节）。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例代码" code={BOOK_CODE} />
    </div>
  );
}
