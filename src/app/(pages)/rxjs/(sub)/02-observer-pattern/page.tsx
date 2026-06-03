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
 * 观察者模式将逻辑分为发布者（Publisher）和观察者（Observer）：
 * - 发布者只管产生事件，通知所有注册的观察者
 * - 观察者只管接收事件后处理，不关心数据如何产生
 * - subscribe 将两者关联起来
 */
export default function ObserverPatternPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.2.1 观察者模式</h1>
        <p className={styles.subtitle}>
          将逻辑分为发布者（Publisher）和观察者（Observer）， 发布者产生数据，观察者响应数据，两者通过 <code>subscribe</code> 关联
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ObserverDemo />
      </section>

      <aside className={styles.description}>
        <h3>观察者模式的三个核心问题</h3>
        <ul>
          <li>
            <strong>如何产生事件？</strong> — 发布者的责任，在 RxJS 中由 <code>Observable</code> 对象完成。例如 <code>Observable.of(1, 2, 3)</code>{" "}
            按顺序产生三个整数。
          </li>
          <li>
            <strong>如何响应事件？</strong> — 观察者的责任，在 RxJS 中由 <code>subscribe</code> 的参数决定。例如 <code>console.log</code> 将每个值输出到控制台。
          </li>
          <li>
            <strong>何时关联？</strong> — 什么样的发布者关联什么样的观察者，即何时调用 <code>subscribe</code>。关联一旦建立，数据便从发布者流向观察者。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例代码" code={BOOK_CODE} />
    </div>
  );
}
