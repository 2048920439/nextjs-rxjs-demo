import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import ImperativeHoldTimer from "./_components/imperative-hold-timer";
import ReactiveHoldTimer from "./_components/reactive-hold-timer";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "1.1 一个简单的RxJS例子",
};

const BOOK_CODE = `// fromEvent(target, eventName) → Observable
// 将 DOM 事件转化为 Observable 数据流，事件变为"可订阅的数据源"
const mouseDown$ = Rx.Observable.fromEvent(document.querySelector('#hold-me'), 'mousedown');
const mouseUp$   = Rx.Observable.fromEvent(document.querySelector('#hold-me'), 'mouseup');

// .timestamp() → Observable<{ value, timestamp }>
// 为流中每个值包裹一层时间戳，记录事件发生的精确时刻
// .withLatestFrom(other$, projectFn) → Observable
// 源流发出值时取另一个流的最新值进行组合。此处 mouseUp 触发时取最新 mouseDown
// 的时间戳，天然保证"必须先按下才能算时长"
const holdTime$ = mouseUp$
  .timestamp()
  .withLatestFrom(mouseDown$.timestamp(), (mouseUpEvent, mouseDownEvent) => {
    return mouseUpEvent.timestamp - mouseDownEvent.timestamp;
  });

// .subscribe(nextFn) → Subscription
// 启动整个流水线。Observable 是惰性的，没人订阅不会执行
holdTime$.subscribe(ms => {
  document.querySelector('#hold-time').innerText = ms;
});

// .flatMap(projectFn) → Observable
// 将流中每个值映射为新 Observable 并自动展平。此处把时长映射为 AJAX 请求流
// （RxJS 7 中改名为 mergeMap）
// .map(projectFn) → Observable
// 纯函数变换，从此处 AJAX 响应中提取 .response 剥离 HTTP 元信息
holdTime$
  .flatMap(ms => Rx.Observable.ajax('https://timing-sense-score-board.herokuapp.com/score/' + ms))
  .map(e => e.response)
  .subscribe(res => {
    document.querySelector('#rank').innerText = '你超过了' + res.rank + '% 的用户';
  });`;

/**
 * 1.1 一个简单的RxJS例子 — 《深入浅出RxJS》
 *
 * 对比命令式编程与响应式编程两种范式：
 * 通过&ldquo;按住按钮计时&rdquo;这个需求，展示同一功能在两种范式下的实现差异。
 */
export default function FunctionalProgrammingPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>1.1 一个简单的RxJS例子</h1>
        <p className={styles.subtitle}>按住按钮计时：对比&ldquo;命令式&rdquo;与&ldquo;响应式&rdquo;两种编程范式</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>React 实现对比</h2>
        <div className={styles.grid}>
          <ImperativeHoldTimer />
          <ReactiveHoldTimer />
        </div>
      </section>

      <aside className={styles.description}>
        <h3>核心差异</h3>
        <ul>
          <li>
            <strong>命令式</strong>：关注 <code>How</code> &mdash; 手动监听 mousedown/mouseup，在回调中计算时长。 每一步&ldquo;怎么做&rdquo;都显式编写。
          </li>
          <li>
            <strong>响应式</strong>：关注 <code>What</code> &mdash; 用 <code>fromEvent</code> 将事件转为 Observable 流， 通过{" "}
            <code>timestamp + withLatestFrom</code> 声明时长计算规则。 代码描述&ldquo;数据该如何流转、变换&rdquo;。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书 RxJS 示例代码" code={BOOK_CODE} />
    </div>
  );
}
