import styles from "./page.module.scss";

export default function OperatorsPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Operators</h1>
      <p className={styles.desc}>
        Operators 是 RxJS 的基石——它们是纯函数，让你以函数式编程的风格 组合复杂的异步操作。通过 <code>pipe()</code> 方法将多个 operator 串联。
      </p>

      <section className={styles.section}>
        <h2>常用 Operators</h2>
        <ul>
          <li>
            <strong>map</strong> — 对每个值进行映射转换
          </li>
          <li>
            <strong>filter</strong> — 过滤满足条件的值
          </li>
          <li>
            <strong>switchMap</strong> — 切换到新的内部 Observable，取消旧的
          </li>
          <li>
            <strong>debounceTime</strong> — 防抖，等待静默期后再发出值
          </li>
          <li>
            <strong>takeUntil</strong> — 直到某个 notifier 发出值才停止
          </li>
          <li>
            <strong>catchError</strong> — 捕获错误并返回备选 Observable
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Pipe 链示例</h2>
        <pre className={styles.code}>
          {`import { of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(
    filter(x => x % 2 === 0),
    map(x => x * 10)
  )
  .subscribe(console.log);
// 输出: 20, 40`}
        </pre>
      </section>
    </div>
  );
}
