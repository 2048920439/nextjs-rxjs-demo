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

// 退订后，事件不再接收
subscription.unsubscribe();
emitter.emit('msg', 'end');    // 不会输出`;

/**
 * 4.3.5 fromEventPattern — 《深入浅出RxJS》
 *
 * 它和 fromEvent 类似，但允许你自己定义“如何绑定”和“如何解绑”。
 * 所以它适合封装非标准事件源。
 */
export default function FromEventPatternPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.5 fromEventPattern</h1>
        <p className={styles.subtitle}>通过 addHandler / removeHandler 包装任意事件源</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <PatternDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>两个回调</strong> 订阅时调用 addHandler，退订时调用 removeHandler。
          </li>
          <li>
            <strong>适用场景</strong> 适合封装自定义 SDK、非标准事件源或现有回调式 API。
          </li>
          <li>
            <strong>只负责 next</strong> 它本身不负责创造 error/complete，需要你在外部处理生命周期。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例代码" code={BOOK_CODE} />
    </div>
  );
}
