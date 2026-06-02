import styles from "./page.module.scss";

export default function CreationOperatorsPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Creation Operators</h1>
      <p className={styles.desc}>创建类 Operator 用于从各种数据源创建 Observable 实例。</p>

      <section className={styles.section}>
        <h2>常用创建 Operator</h2>
        <ul>
          <li>
            <strong>of</strong> — 将参数列表转为 Observable，依次发出后 complete
          </li>
          <li>
            <strong>from</strong> — 将数组、Promise、Iterable 转为 Observable
          </li>
          <li>
            <strong>interval</strong> — 每隔指定时间发出递增数字
          </li>
          <li>
            <strong>timer</strong> — 延迟后发出值（可指定间隔重复）
          </li>
          <li>
            <strong>fromEvent</strong> — 将 DOM 事件转为 Observable
          </li>
          <li>
            <strong>combineLatest</strong> — 组合多个 Observable，任一更新即发出最新组合值
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>示例</h2>
        <pre className={styles.code}>
          {`import { of, from, interval } from 'rxjs';
import { take } from 'rxjs/operators';

// of - 直接发出值
of(1, 2, 3).subscribe(console.log); // 1, 2, 3

// from - 从数组创建
from([10, 20, 30]).subscribe(console.log); // 10, 20, 30

// interval - 每秒发出递增数字（取前 3 个）
interval(1000).pipe(take(3)).subscribe(console.log); // 0, 1, 2`}
        </pre>
      </section>
    </div>
  );
}
