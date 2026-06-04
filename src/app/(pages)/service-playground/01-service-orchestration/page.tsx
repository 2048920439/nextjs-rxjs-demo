import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import NumberDemo from "./_components/number-demo";
import { ServiceProvider } from "./_components/service-provider";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "1.1 状态内聚编排模式",
};

const SERVICE_CODE = `class NumberOrchestrationService extends BaseService {
  // ── 源状态 ──
  private _number$ = new BehaviorSubject(1);
  get number()    { return this._number$.value; }
  readonly number$ = this._number$.asObservable();

  // ── 派生：pipe 承载派生关系，tap 桥接同步缓存 ──
  private _squareCache = this.number * this.number;
  get square()    { return this._squareCache; }
  readonly square$ = this.number$.pipe(
    map(n => n * n),
    tap(cached => { this._squareCache = cached; }),
    share(),
  );

  increment() { this._number$.next(this.number + 1); }
  decrement() { this._number$.next(this.number - 1); }
  reset()     { this._number$.next(1); }
}`;

const UI_CODE = `// ── 编排层：获取 Service，useCallback 稳定化回调 ──
function NumberDemo() {
  const svc = useService(NumberOrchestrationService);
  const inc = useCallback(() => svc.increment(), [svc]);
  const dec = useCallback(() => svc.decrement(), [svc]);

  return (
    <>
      <SourceCard />        {/* 独立订阅 number$ */}
      <DerivedCard />       {/* 独立订阅 square$ */}
      <ControlButtons onInc={inc} onDec={dec} onReset={dec} />
    </>
  );
}

// ── 子组件各自独立订阅，React.memo 防止无关重渲染 ──
const SourceCard = memo(() => {
  const svc = useService(NumberOrchestrationService);
  return <Card value={useObservableState(svc.number$, () => svc.number)} />;
});

const DerivedCard = memo(() => {
  const svc = useService(NumberOrchestrationService);
  return <Card value={useObservableState(svc.square$, () => svc.square)} />;
});

const ControlButtons = memo(({ onInc, onDec, onReset }) => (
  <>
    <button onClick={onDec}>−</button>
    <button onClick={onReset}>↺</button>
    <button onClick={onInc}>+</button>
  </>
));`;

/**
 * 1.1 状态内聚编排模式
 *
 * 演示私有变量 + pipe 编排 + getter 快照 + useObservableState 消费的完整模式。
 */
export default function ServiceOrchestrationPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>1.1 状态内聚编排模式</h1>
        <p className={styles.subtitle}>
          <code>BehaviorSubject</code> 作为源状态 → <code>square$</code> 纯派生流 → <code>tap</code> 同步缓存 → <code>useObservableState</code> 各自独立消费
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ServiceProvider>
          <NumberDemo />
        </ServiceProvider>
      </section>

      <aside className={styles.description}>
        <h3>模式要点</h3>
        <ul>
          <li>
            <strong>源流即状态</strong> — <code>BehaviorSubject</code> 同时承载状态值、变更通知、同步快照三重职责，无需额外触发器。
          </li>
          <li>
            <strong>派生即管道</strong> — <code>square$ = number$.pipe(map(...), tap(...), share())</code> 是纯声明式派生，可作为独立 Observable 被其它 Service
            订阅。
          </li>
          <li>
            <strong>独立订阅 + React.memo</strong> — <code>SourceCard</code> 订阅 <code>number$</code>、<code>DerivedCard</code> 订阅 <code>square$</code>
            ，各自独立获取 Service 实例；
            <code>ControlButtons</code> 接收 <code>useCallback</code> 稳定引用，永不重渲染。
          </li>
          <li>
            <strong>快照即缓存</strong> — <code>tap</code> 将最新派生值写入 <code>_square</code>，getter 提供同步访问；配合 <code>React.memo</code>
            ，即使父级重渲染，未变更的子组件自动跳过。
          </li>
        </ul>
      </aside>

      <CodeBlock title="Service 实现" code={SERVICE_CODE} />
      <CodeBlock title="UI 消费" code={UI_CODE} />
    </div>
  );
}
