import styles from "./page.module.scss";

export default function FilteringOperatorsPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Filtering Operators</h1>
      <p className={styles.desc}>过滤类 Operator 用于根据条件选择性发出值，控制数据流的输出。</p>

      <section className={styles.section}>
        <h2>常用过滤 Operator</h2>
        <ul>
          <li>
            <strong>filter</strong> — 只发出满足条件的值
          </li>
          <li>
            <strong>first</strong> — 只发出第一个值（可带条件）
          </li>
          <li>
            <strong>take</strong> — 只取前 N 个值后 complete
          </li>
          <li>
            <strong>skip</strong> — 跳过前 N 个值
          </li>
          <li>
            <strong>distinctUntilChanged</strong> — 连续重复的值只发一次
          </li>
          <li>
            <strong>debounceTime</strong> — 防抖，等待静默期后再发出
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>示例</h2>
        <pre className={styles.code}>
          {`import { of } from 'rxjs';
import { filter, take, skip } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(filter(x => x % 2 === 0))
  .subscribe(console.log);
// 输出: 2, 4

of('a', 'b', 'c', 'd')
  .pipe(take(2))
  .subscribe(console.log);
// 输出: a, b

of('a', 'b', 'c', 'd')
  .pipe(skip(2))
  .subscribe(console.log);
// 输出: c, d`}
        </pre>
      </section>
    </div>
  );
}
