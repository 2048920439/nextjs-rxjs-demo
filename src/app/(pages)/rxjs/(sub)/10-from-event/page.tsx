import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import ClickCounter from "./_components/click-counter";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.4 fromEvent",
};

const BOOK_CODE = `// 4.3.4 fromEvent：将 DOM 事件转化为 Observable
import { fromEvent } from 'rxjs';

const click$ = fromEvent(
  document.querySelector('#clickMe'),
  'click'
);

click$.subscribe(() => {
  // 每次点击按钮时触发
  document.querySelector('#text').innerText = ++clickCount;
});`;

const NODE_CODE = `// fromEvent 也支持 Node.js EventEmitter
import { fromEvent } from 'rxjs';
import EventEmitter from 'events';

const emitter = new EventEmitter();
const source$ = fromEvent(emitter, 'msg');

source$.subscribe(console.log);

emitter.emit('msg', 1);  // 输出 1
emitter.emit('msg', 2);  // 输出 2
emitter.emit('msg', 3);  // 输出 3`;

/**
 * 4.3.4 fromEvent — 《深入浅出RxJS》
 *
 * fromEvent 是 DOM 与 RxJS 世界的桥梁。它将 DOM 事件或 Node.js EventEmitter
 * 转化为 Observable，产生的是 Hot Observable。
 */
export default function FromEventPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.4 fromEvent</h1>
        <p className={styles.subtitle}>
          DOM 事件 → Observable 的桥梁 — 产生 <strong>Hot Observable</strong>，数据源在 RxJS 外部
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ClickCounter />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>Hot Observable</strong> — fromEvent 产生的数据流是 Hot 的：数据源的产生与订阅无关。 订阅之前触发的事件已丢失，Observer
            只能看到订阅之后的事件。
          </li>
          <li>
            <strong>浏览器 DOM</strong> — 第一个参数是 DOM 元素，第二个参数是事件名（如 click、mousemove）。
          </li>
          <li>
            <strong>Node.js</strong> — 支持 EventEmitter 实例，按事件名过滤。 必须在 subscribe 之后再 emit 才能收到数据。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 — DOM 事件" code={BOOK_CODE} />
      <CodeBlock title="原书示例 — Node.js EventEmitter" code={NODE_CODE} />
    </div>
  );
}
