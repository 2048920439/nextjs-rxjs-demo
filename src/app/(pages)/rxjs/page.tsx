import styles from "./page.module.scss";

export default function RxjsIndexPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>RxJS 响应式编程学习</h1>
      <p className={styles.desc}>
        RxJS (Reactive Extensions for JavaScript) 是一个使用 Observable 进行响应式编程的库，让编写异步和基于事件的程序变得更加容易。
      </p>
      <p className={styles.hint}>请从左侧目录选择一个主题开始学习 →</p>
    </div>
  );
}
