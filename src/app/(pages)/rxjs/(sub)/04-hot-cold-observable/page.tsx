import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import HotColdDemo from "./_components/hot-cold-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "2.4 Hot Observable和Cold Observable",
};

const BOOK_CODE_COLD = `// Cold Observable — 每次订阅创建一个新的"生产者"
const cold$ = new Observable(observer => {
  const producer = new Producer();
  // observer 接收该 producer 的数据
});`;

const BOOK_CODE_HOT = `// Hot Observable — 生产者独立于订阅，全局共享
const producer = new Producer();
const hot$ = new Observable(observer => {
  // observer 连接已存在的 producer
});`;

/**
 * 2.4 Hot Observable 和 Cold Observable — 《深入浅出RxJS》
 *
 * Cold：每次 subscribe 创建新的生产者，Observer 收到完整序列（如视频点播）
 * Hot：共享一个外部生产者，后来者只看得到订阅之后的数据（如电视直播）
 */
export default function HotColdObservablePage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.4 Hot Observable 和 Cold Observable</h1>
        <p className={styles.subtitle}>同一个 Observable，多 Observer 订阅时的行为差异 — 取决于{'"生产者"'}的创建时机</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <HotColdDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心区别</h3>
        <ul>
          <li>
            <strong>❄️ Cold Observable</strong> — 每次 <code>subscribe</code> 都在内部创建一个新的生产者， 每个 Observer 独立收到完整的 1→2→3→4→5
            序列。类比：视频点播，每个人从头看起。
          </li>
          <li>
            <strong>🔥 Hot Observable</strong> — 生产者创建与订阅无关，所有 Observer 共享同一个数据源。
            后来者加入时只能看到当前及之后的值，之前的已错过。类比：电视直播，换台后看不到之前的节目。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 — Cold" code={BOOK_CODE_COLD} />
      <CodeBlock title="原书示例 — Hot" code={BOOK_CODE_HOT} />
    </div>
  );
}
