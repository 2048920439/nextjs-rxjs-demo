import { BehaviorSubject, map, mergeMap, type Subscription, take, tap, timer, toArray, windowTime } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 windowTime 如何按时间切出内部 Observable",
  operatorLabel: "source$.pipe(windowTime(4000))",
  sourceValues: [],
  outputs: [],
};

export class WindowTimeDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({ ...INITIAL_STATE, running: true, status: "每 4000ms 开启并关闭一个时间窗口，窗口内部继续接收 source$ 的值" });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let windowIndex = 0;

    const result$ = timer(0, 1000).pipe(
      take(8),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，它会进入当前打开的 window`,
        });
      }),
      windowTime(4000),
      mergeMap((window$) => {
        const label = `window ${windowIndex}`;
        windowIndex += 1;

        return window$.pipe(
          toArray(),
          map((values) => ({
            label,
            values: values.map(String),
            at: stamp(),
          })),
        );
      }),
    );

    this.subscription = result$.subscribe({
      next: (output) => {
        this.patchState({
          outputs: [...this.state.outputs, output],
          status: `${output.label} 完结，收集到 [${output.values.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false, status: "windowTime 完成：下游收到的是一个个内部 Observable" });
      },
    });
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private patchState(patch: Partial<WindowBufferDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
