import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import PatternDemo from "./_components/pattern-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.5 fromEventPattern",
};

const BOOK_CODE = `// 4.3.5 fromEventPattern：灵活的事件模式
import { fromEventPattern } from 'rxjs';

const addHandler = (handler) => {
  emitter.addListener('msg', handler);
};

const removeHandler = (handler) => {
  emitter.removeListener('msg', handler);
};

const source$ = fromEventPattern(addHandler, removeHandler);

source$.subscribe(console.log);

emitter.emit('msg', 'hello'); // 输出 hello
emitter.emit('msg', 'world'); // 输出 world

// 退订后的事件不再接收
subscription.unsubscribe();
emitter.emit('msg', 'end');    // 不会输出`;

/**
 * 4.3.5 fromEventPattern — 《深入浅出RxJS》
 *
 * 比 fromEvent 更灵活：通过 addHandler/removeHandler 两个回调，
 * 将任意事件源包装为 Observable。
 */
export default function FromEventPatternPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.5 fromEventPattern</h1>
        <p className={styles.subtitle}>比 fromEvent 更灵活 — 通过 addHandler / removeHandler 模式包装任意事件源</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <PatternDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>两个回调参数</strong> — 订阅时调用 addHandler，退订时调用 removeHandler。 handler 函数相当于 Observer 的 next。
          </li>
          <li>
            <strong>适用场景</strong> — 当事件源不遵循 DOM 或 EventEmitter 模式时使用。 如自定义 SDK、WebSocket 封装等。
          </li>
          <li>
            <strong>局限性</strong> — 不支持 error 和 complete 事件。只能向 Observable 推送 next 数据。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
