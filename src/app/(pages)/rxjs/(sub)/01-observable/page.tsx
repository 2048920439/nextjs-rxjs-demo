import styles from "./page.module.scss";

export default function ObservablePage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Observable</h1>
      <p className={styles.desc}>Observable 是 RxJS 的核心概念。它代表一个可调用的未来值或事件的集合。</p>

      <section className={styles.section}>
        <h2>核心特征</h2>
        <ul>
          <li>
            <strong>惰性求值</strong> — 只有订阅（subscribe）后才开始推送数据
          </li>
          <li>
            <strong>可取消</strong> — 通过 unsubscribe 停止接收数据
          </li>
          <li>
            <strong>支持多值</strong> — 可以推送 0 到无限多个值
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>基本用法</h2>
        <pre className={styles.code}>
          {`import { Observable } from 'rxjs';

const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

observable.subscribe({
  next: value => console.log(value),
  complete: () => console.log('Done!'),
});
// 输出: 1, 2, 3, Done!`}
        </pre>
      </section>
    </div>
  );
}
