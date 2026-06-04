import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import AjaxDemo from "./_components/ajax-demo";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "4.3.6 ajax",
};

const BOOK_CODE = `// 4.3.6 ajax：将 AJAX 请求转化为 Observable
import { ajax } from 'rxjs/ajax';

// 调用项目内部 /api/mock/delay?ms=1500 接口
// 服务端延迟 1500ms 后返回 { success: true, delay: 1500 }
const url = '/api/mock/delay?ms=1500';

ajax.getJSON(url).subscribe(data => {
  console.log('Delay:', data.delay, 'ms');
});`;

/**
 * 4.3.6 ajax — 《深入浅出RxJS》
 *
 * ajax 操作符将 HTTP 请求转化为 Observable 流，与 RxJS 管道无缝衔接。
 */
export default function AjaxPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.6 ajax</h1>
        <p className={styles.subtitle}>AJAX 请求 → Observable — 将 HTTP 响应作为数据流处理</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <AjaxDemo />
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>ajax.getJSON(url)</strong> — 快捷方法，返回 Observable，吐出的数据是 JSON 解析后的对象。
          </li>
          <li>
            <strong>与管道组合</strong> — ajax 产生的 Observable 可与其他操作符组合使用。 简单的 AJAX 请求看不出 RxJS
            优势，复杂场景（如防抖、重试、响应转换）才显威力。
          </li>
          <li>
            <strong>独立模块</strong> — {"<code>import { ajax } from 'rxjs/ajax'</code>"}， ajax 是独立子模块，需单独引入。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例 — 调用内部 /api/mock/delay 接口" code={BOOK_CODE} />
    </div>
  );
}
