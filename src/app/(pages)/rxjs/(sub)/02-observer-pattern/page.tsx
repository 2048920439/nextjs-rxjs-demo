import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import ObserverDemo from "./_components/observer-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "2.2.1 观察者模式",
};

const BOOK_CODE = `import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

// source$ 是发布者（Publisher），产生数据流 1, 2, 3
const source$ = Observable.of(1, 2, 3);

// console.log 是观察者（Observer），接收并处理每个数据
source$.subscribe(console.log);`;

/**
 * 2.2.1 观察者模式 — 《深入浅出RxJS》
 *
 * 这一页只保留最核心的关系：
 * Observable 负责发数据，Observer 负责收数据，subscribe 负责把两者连起来。
 */
export default function ObserverPatternPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.2.1 观察者模式</h1>
        <p className={styles.subtitle}>
          发布者产生数据，观察者接收数据，二者通过 <code>subscribe</code> 连接起来
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ObserverDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心概念</h3>
        <ul>
          <li>
            <strong>发布者（Publisher）</strong> 负责产生事件，在 RxJS 中由 <code>Observable</code> 表示。
          </li>
          <li>
            <strong>观察者（Observer）</strong> 负责接收事件，最常见的形式就是传给 <code>subscribe</code> 的回调。
          </li>
          <li>
            <strong>subscribe</strong> 把发布者和观察者连接起来，数据从此开始流动。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例代码" code={BOOK_CODE} />
    </div>
  );
}
