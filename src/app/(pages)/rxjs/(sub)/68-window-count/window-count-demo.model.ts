import { BehaviorSubject, concat, delay, map, mergeMap, of, type Subscription, tap, toArray, windowCount } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 windowCount 如何按数量切出内部 Observable",
  operatorLabel: "source$.pipe(windowCount(4))",
  sourceValues: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export class WindowCountDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({ ...INITIAL_STATE, running: true, status: "windowCount(4) 每收满 4 个值就关闭当前窗口并开启下一个窗口" });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let windowIndex = 0;

    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，windowCount 按数量归入当前窗口`,
        });
      }),
      windowCount(4),
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
        this.patchState({ running: false, status: "windowCount 完成：最后不足 4 个值也会随 source$ 完结而关闭" });
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
