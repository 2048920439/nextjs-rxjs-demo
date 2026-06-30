import type { Metadata } from "next";

import CodeBlock from "@/app/(components)/code-block";

import DragDemo from "./_components/drag-demo";
import { ServiceProvider } from "./_components/service-provider";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "2.1 concatMap 拖拽流",
};

const SERVICE_CODE = `class ConcatMapDragService extends BaseService {
  private stateSubject = new BehaviorSubject(initialState);
  readonly state$ = this.stateSubject.asObservable();

  connect(stage: HTMLElement, box: HTMLElement) {
    const down$ = fromEvent<PointerEvent>(box, "pointerdown");
    const move$ = fromEvent<PointerEvent>(stage, "pointermove");
    const stop$ = merge(
      fromEvent<PointerEvent>(stage, "pointerup"),
      fromEvent<PointerEvent>(stage, "pointercancel"),
      fromEvent<PointerEvent>(stage, "pointerleave"),
    );

    this.dragSubscription = down$.pipe(
      tap((event) => {
        event.preventDefault();
        box.setPointerCapture?.(event.pointerId);
      }),
      map((event) => captureStart(event, this.state)),
      concatMap((start) =>
        move$.pipe(
          map((event) => toBoxPosition(stage, start, event)),
          takeUntil(
            stop$.pipe(
              tap(() => box.releasePointerCapture?.(start.pointerId)),
            ),
          ),
        ),
      ),
    ).subscribe((point) => this.patchState(point));
  }
}`;

const WHY_CONCAT_MAP = `mousedown$ ----a----------b------|
              concatMap(start => mousemove$.pipe(takeUntil(mouseup$)))

drag$      ----a0-a1-a2----b0-b1-|

concatMap 把每一次 mousedown 映射成一段 mousemove 内部流；
当前拖拽没有结束前，下一段拖拽不会和它交叉。`;

export default function ConcatMapDragPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.1 concatMap 拖拽流</h1>
        <p className={styles.subtitle}>
          用页面私有 Service 管理拖拽事件流：<code>pointerdown$</code> 触发一次拖拽，<code>concatMap</code> 把它映射成一段直到
          <code>pointerup$</code> 结束的 <code>pointermove$</code>。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <ServiceProvider>
          <DragDemo />
        </ServiceProvider>
      </section>

      <aside className={styles.description}>
        <h3>模式要点</h3>
        <ul>
          <li>
            <strong>Service 持有事件管道</strong>：组件只传入 DOM 节点和消费状态，拖拽编排集中在页面私有 Service 中。
          </li>
          <li>
            <strong>一次 down，一段 move</strong>：<code>concatMap</code> 把每次按下映射为一段内部 <code>pointermove$</code>。
          </li>
          <li>
            <strong>takeUntil 管结束</strong>：<code>pointerup$</code>、<code>pointercancel$</code> 或离开舞台都会让当前内部流 complete。
          </li>
        </ul>
      </aside>

      <CodeBlock title="Service 核心实现" code={SERVICE_CODE} />
      <CodeBlock title="为什么是 concatMap" code={WHY_CONCAT_MAP} />
    </div>
  );
}
