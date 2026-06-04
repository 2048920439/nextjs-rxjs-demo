import styles from "./page.module.scss";

export default function ServicePlaygroundIndexPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Service Playground</h1>
      <p className={styles.desc}>Service 层状态管理模式的实验场 — 探索 BehaviorSubject、pipe 编排、getter 快照、useObservableState 消费等模式的最佳组合。</p>
      <p className={styles.hint}>请从左侧目录选择一个主题开始 →</p>
    </div>
  );
}
