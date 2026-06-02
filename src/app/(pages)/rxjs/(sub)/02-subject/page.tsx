import styles from "./page.module.scss";

export default function SubjectPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Subject</h1>
      <p className={styles.desc}>
        Subject 是一种特殊的 Observable，它既是 Observable（可订阅）又是 Observer（可手动推送值）， 使得多个订阅者能够共享同一个数据源。
      </p>

      <section className={styles.section}>
        <h2>Subject 类型</h2>
        <ul>
          <li>
            <strong>Subject</strong> — 基础版，订阅者只收到订阅之后的值
          </li>
          <li>
            <strong>BehaviorSubject</strong> — 保留最新值，新订阅者立即收到当前值
          </li>
          <li>
            <strong>ReplaySubject</strong> — 缓存指定数量的历史值，重放给新订阅者
          </li>
          <li>
            <strong>AsyncSubject</strong> — 只在 complete 时推送最后一个值
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>BehaviorSubject 示例</h2>
        <pre className={styles.code}>
          {`import { BehaviorSubject } from 'rxjs';

const subject = new BehaviorSubject(0);

subject.subscribe(v => console.log('A:', v));
// A: 0  （立即收到当前值）

subject.next(1);
// A: 1

subject.subscribe(v => console.log('B:', v));
// B: 1  （新订阅者收到最新值）

subject.next(2);
// A: 2
// B: 2`}
        </pre>
      </section>
    </div>
  );
}
