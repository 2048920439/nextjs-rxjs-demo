import { BehaviorSubject, concatMap, fromEvent, map, merge, type Subscription, takeUntil, tap } from "rxjs";

import { BaseService, type LifecycleHooks } from "@/service-core";

type DragPoint = {
  x: number;
  y: number;
};

export type DragBoxState = {
  left: number;
  top: number;
  dragging: boolean;
  dragCount: number;
  moveCount: number;
  status: string;
  lastPoint: DragPoint | null;
};

const INITIAL_STATE: DragBoxState = {
  left: 32,
  top: 32,
  dragging: false,
  dragCount: 0,
  moveCount: 0,
  status: "按住方块并拖动，观察 concatMap 如何把一次 mousedown 映射成一段 mousemove 流",
  lastPoint: null,
};

type DragStart = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  initialLeft: number;
  initialTop: number;
};

/**
 * 页面私有拖拽 Service。
 *
 * 这个示例刻意把 DOM 事件流放在 Service 内部，而不是组件里：
 * - 组件只负责把 stage/box DOM 节点交给 connect，并订阅 state$ 渲染。
 * - Service 负责把 pointerdown/pointermove/pointerup 编排成一条拖拽数据流。
 * - concatMap 的角色是把“一次按下”映射为“一段移动”，并保证每段移动流顺序完成。
 */
export class ConcatMapDragService extends BaseService {
  constructor() {
    super();
  }

  /**
   * BehaviorSubject 同时承担三件事：
   * - 保存拖拽盒子的同步快照，供 getter 读取。
   * - 向 React UI 推送状态变化，供 useObservableState 消费。
   * - 作为 Service 的唯一可变状态入口，避免组件分散维护拖拽细节。
   */
  private readonly stateSubject = new BehaviorSubject<DragBoxState>(INITIAL_STATE);

  /**
   * connect 会在组件挂载后绑定真实 DOM 事件，因此这里保留订阅引用。
   * 页面卸载、ref 变化或重复 connect 时，都必须取消旧订阅，避免重复监听。
   */
  private dragSubscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  connect(stage: HTMLElement, box: HTMLElement) {
    this.dragSubscription?.unsubscribe();

    /**
     * 外层流：每一次 pointerdown 代表一次“拖拽会话”的开始。
     * 内层流：这次拖拽期间的 pointermove 序列。
     * 结束流：pointerup / pointercancel / pointerleave 任一事件都会结束当前拖拽。
     */
    const pointerDown$ = fromEvent<PointerEvent>(box, "pointerdown");
    const pointerMove$ = fromEvent<PointerEvent>(stage, "pointermove");
    const pointerUp$ = merge(
      fromEvent<PointerEvent>(stage, "pointerup"),
      fromEvent<PointerEvent>(stage, "pointercancel"),
      fromEvent<PointerEvent>(stage, "pointerleave"),
    );

    this.dragSubscription = pointerDown$
      .pipe(
        tap((event) => {
          // 阻止默认选中文本等浏览器行为，并尽量让 box 捕获后续同一 pointer 的事件。
          event.preventDefault();
          box.setPointerCapture?.(event.pointerId);
        }),
        map((event): DragStart => this.toDragStart(event)),
        concatMap((start) => {
          /**
           * concatMap 是本示例的核心：
           * - project 输入是一次 pointerdown 的 DragStart。
           * - project 输出是一段 pointermove$ 内部 Observable。
           * - concatMap 会等待当前内部 Observable complete 后，才处理下一次 pointerdown。
           *
           * 对拖拽来说，一次拖拽天然是一段从 down 到 up 的连续过程；
           * 用 concatMap 表达这个“会话边界”，比在组件里手写 dragging 标志更清晰。
           */
          this.patchState({
            dragging: true,
            dragCount: this.state.dragCount + 1,
            status: `drag ${this.state.dragCount + 1} 开始：concatMap 订阅本次 pointermove$，直到 pointerup$`,
            lastPoint: { x: start.initialLeft, y: start.initialTop },
          });

          return pointerMove$.pipe(
            // 每个 move 事件都根据“本次拖拽的起点”计算 box 应该移动到的位置。
            map((moveEvent) => this.toBoxPosition(stage, start, moveEvent)),
            takeUntil(
              /**
               * takeUntil 负责关闭当前内部流。
               * 一旦 pointerUp$ 发出任意结束事件，当前 move 流 complete，
               * concatMap 随后才允许下一次 pointerdown 开启新的内部流。
               */
              pointerUp$.pipe(
                tap((event) => {
                  box.releasePointerCapture?.(start.pointerId);
                  this.patchState({
                    dragging: false,
                    status: `drag ${this.state.dragCount} 结束：takeUntil 收到 ${event.type}，当前内部流 complete`,
                  });
                }),
              ),
            ),
          );
        }),
      )
      .subscribe((point) => {
        // 订阅端只处理已经由 concatMap 摊平成一阶流的位置数据。
        this.patchState({
          left: point.x,
          top: point.y,
          moveCount: this.state.moveCount + 1,
          status: `mousemove -> (${Math.round(point.x)}, ${Math.round(point.y)})，仍在当前 concatMap 内部流`,
          lastPoint: point,
        });
      });
  }

  disconnect() {
    // 组件 ref 生命周期结束时主动断开 DOM 事件流。
    this.dragSubscription?.unsubscribe();
    this.dragSubscription = null;
    this.patchState({
      dragging: false,
      status: "拖拽流已断开",
    });
  }

  reset() {
    this.patchState(INITIAL_STATE);
  }

  protected override setup(hooks: LifecycleHooks) {
    // ServiceRegistryProvider 卸载时兜底清理，防止 DOM 事件订阅泄漏。
    hooks.onUnmount(() => {
      this.dragSubscription?.unsubscribe();
      this.dragSubscription = null;
    });
  }

  private toDragStart(event: PointerEvent): DragStart {
    const current = this.state;

    /**
     * 记录拖拽开始时的两组基准值：
     * - pointer 的起点，用于计算鼠标移动了多少。
     * - box 的起点，用于把移动距离叠加到当前盒子位置上。
     */
    return {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      initialLeft: current.left,
      initialTop: current.top,
    };
  }

  private toBoxPosition(stage: HTMLElement, start: DragStart, event: PointerEvent): DragPoint {
    /**
     * 坐标计算只依赖三个输入：舞台尺寸、拖拽起点、当前 pointer 位置。
     * 这里保持为纯计算，方便和 RxJS 管道里的副作用分开理解。
     */
    const rect = stage.getBoundingClientRect();
    const maxX = rect.width - 96;
    const maxY = rect.height - 96;
    const x = start.initialLeft + event.clientX - start.startClientX;
    const y = start.initialTop + event.clientY - start.startClientY;

    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  }

  private patchState(patch: Partial<DragBoxState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
