import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import DeferDemo from "./_components/defer-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.8 defer",
};

const BOOK_CODE = `// 4.3.8 defer：延迟创建真正的 Observable
import { defer, of } from 'rxjs';

// 创建时只保存工厂函数，不创建真正的 data source
const observableFactory = () => of(1, 2, 3);
const source$ = defer(observableFactory);

// 只有订阅时才调用 factory，创建真正的 Observable
source$.subscribe(console.log);`;

const BOOK_CODE_AJAX = `// defer 的实际用途：推迟 AJAX 请求
import { defer } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const observableFactory = () => ajax(ajaxUrl);
const source$ = defer(observableFactory);
// 此时 AJAX 请求尚未发送

// 订阅时才发送 AJAX 请求
source$.subscribe(data => console.log(data));`;

/**
 * 4.3.8 defer — 《深入浅出RxJS》
 *
 * defer 解决"想早创建 Observable 但不想早占用资源"的矛盾。
 * 创建时只是一个代理，订阅时才创建真正的 Observable。
 */
export default function DeferPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.8 defer</h1>
        <p className={styles.subtitle}>
          延迟创建 — 代理模式，创建时不分配资源，<strong>订阅时才创建</strong>真正的 Observable
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
            <strong>代理模式</strong> — defer 产生的 Observable 是一个代理（Proxy）， 创建时不占用资源，订阅时才调用工厂函数创建真正的 Observable。
          </li>
          <li>
            <strong>工厂函数</strong> — 接受一个函数参数，返回 Observable 或 Promise。 每次都可在工厂中根据当前状态决定返回什么数据流。
          </li>
          <li>
            <strong>应用场景</strong> — 推迟 AJAX 请求、根据最新条件创建数据源、 确保每次订阅都获得独立的新 Observable。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 — 基本用法" code={BOOK_CODE} />
      <CodeBlock title="原书示例 — 推迟 AJAX 请求" code={BOOK_CODE_AJAX} />
    </div>
  );
}
