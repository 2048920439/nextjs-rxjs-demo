import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import TimingDemo from "./_components/timing-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.1 interval与timer：定时产生数据",
};

const BOOK_CODE = `// 4.3.1 interval 和 timer
import { interval, timer } from 'rxjs';

// interval：每 1000ms 吐出递增整数（0, 1, 2, 3, ...），永不完结
const interval$ = interval(1000);

// timer：单次延时 1000ms 后吐出 0，然后 complete
const timerOnce$ = timer(1000);

// timer：2000ms 后吐出 0，之后每 1000ms 吐出递增整数
const timerRepeat$ = timer(2000, 1000);

// timer 支持 Date 参数
const later = new Date(Date.now() + 1000);
const timerDate$ = timer(later);`;

const BOOK_CODE_MAP = `// interval 从 1 开始（组合 map）
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

const result$ = interval(1000).pipe(map(x => x + 1));`;

/**
 * 4.3.1 interval 和 timer — 《深入浅出RxJS》
 *
 * interval 对应 setInterval，timer 对应 setTimeout（但功能是 setTimeout 的超集）。
 * 两者都产生异步数据流，不会主动 complete。
 */
export default function IntervalTimerPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.1 interval 和 timer：定时产生数据</h1>
        <p className={styles.subtitle}>
          RxJS 世界的 <code>setInterval</code> 与 <code>setTimeout</code> — 但功能更强
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <TimingDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>interval</strong> — 对应 <code>setInterval</code>。参数为间隔毫秒数，从 0 开始递增，永不完结。 如需从 1 开始可用{" "}
            <code>.pipe(map(x =&gt; x + 1))</code>。
          </li>
          <li>
            <strong>timer（单参数）</strong> — 对应 <code>setTimeout</code>。延迟指定的毫秒数后吐出 0，然后 complete。 支持数值或 Date 对象作为参数。
          </li>
          <li>
            <strong>timer（双参数）</strong> — 功能是 setTimeout 的超集。第一个参数为初始延迟， 第二个参数为周期间隔，产生类似 interval 的持续数据流。
          </li>
          <li>
            <strong>两者均不会主动 complete</strong> — 需要手动 unsubscribe 来停止数据流（timer 单参数除外）。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="组合 map：从 1 开始递增" code={BOOK_CODE_MAP} />
    </div>
  );
}
