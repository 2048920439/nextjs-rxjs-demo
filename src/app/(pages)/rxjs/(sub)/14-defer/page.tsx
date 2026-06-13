import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import DeferDemo from "./_components/defer-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.8 defer",
};

const BOOK_CODE = `// 4.3.8 defer：延迟创建真正的 Observable
import { defer, of } from 'rxjs';

// 创建时只保存工厂函数，不会立刻执行
const observableFactory = () => of(1, 2, 3);
const source$ = defer(observableFactory);

// 每次订阅时才执行 factory
source$.subscribe(console.log);`;

const BOOK_CODE_AJAX = `// defer 的实际用途：延迟 AJAX 请求
import { defer } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const source$ = defer(() => ajax(ajaxUrl));
source$.subscribe(data => console.log(data));`;

/**
 * 4.3.8 defer — 《深入浅出RxJS》
 *
 * defer 的核心不是“记录时间”，而是把真正的数据源创建推迟到订阅时刻。
 * 这样同一个 Observable 在不同订阅下可以得到不同的结果。
 */
export default function DeferPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.8 defer</h1>
        <p className={styles.subtitle}>
          创建时只保存工厂函数，真正的 Observable 要等到 <strong>订阅时</strong> 才生成
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <DeferDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>延迟执行</strong> defer 不会在创建时执行 factory，而是在订阅时调用它。
          </li>
          <li>
            <strong>每次订阅都是新的结果</strong> 这就是它和普通 <code>of(...)</code> 最大的区别。
          </li>
          <li>
            <strong>典型场景</strong> 延迟 AJAX 请求、按需创建数据源、根据最新状态生成 Observable。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 - 基本用法" code={BOOK_CODE} />
      <CodeBlock title="原书示例 - 延迟 AJAX 请求" code={BOOK_CODE_AJAX} />
    </div>
  );
}
