import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import RepeatWhenDemo from "./_components/repeat-when-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.7 repeatWhen",
};

const BOOK_CODE = `// 4.3.7 repeatWhen：受控的重复订阅
import { interval, of } from 'rxjs';
import { repeatWhen } from 'rxjs/operators';

// 每隔 1s 重新订阅 source$
const notifier = () => interval(1000);
const source$ = of(1, 2, 3);
const repeated$ = source$.pipe(repeatWhen(notifier));

// 更精确：上游完结后等待 2s 再重新订阅
const preciseNotifier = (notification$) => {
  return notification$.pipe(delay(2000));
};
const precise$ = source$.pipe(repeatWhen(preciseNotifier));`;

/**
 * 4.3.7 repeatWhen — 《深入浅出RxJS》
 *
 * 与 repeat 类似，但通过 notifier Observable 控制重新订阅的节奏。
 * notification$ 在上游每次完结时发出一个值。
 */
export default function RepeatWhenPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.7 repeatWhen</h1>
        <p className={styles.subtitle}>
          受控重复 — 用 notifier Observable <strong>控制</strong>重新订阅的节奏
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <RepeatWhenDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>vs repeat</strong> — repeat 在上游完结后立即重新订阅，repeatWhen 可以控制重新订阅的时机和节奏。
          </li>
          <li>
            <strong>notifier 函数</strong> — 返回一个 Observable，当它发出值时触发重新订阅。 值本身不重要，发出的时机才重要。
          </li>
          <li>
            <strong>notification$ 参数</strong> — notifier 可接受 notification$ 参数， 它是上游每次完结时发出一个值的 Observable，适合做精确延时。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
