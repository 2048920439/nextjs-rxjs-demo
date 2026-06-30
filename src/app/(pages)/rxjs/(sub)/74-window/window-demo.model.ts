import { BehaviorSubject, concat, delay, map, mergeMap, of, type Subscription, tap, timer, toArray, window } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 window 如何用 notifier$ 同时关闭旧窗口并开启新窗口",
  operatorLabel: "source$.pipe(window(notifier$))",
  sourceValues: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5, 6, 7];

export class WindowDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({ ...INITIAL_STATE, running: true, status: "notifier$ 每 4000ms 发值：关闭当前窗口，同时开启下一个窗口" });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let windowIndex = 0;

    const notifier$ = timer(4000, 4000);
    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，进入当前 notifier window`,
        });
      }),
      window(notifier$),
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
          status: `${output.label} 被 notifier$ 切开，内容是 [${output.values.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false, status: "window 完成：source$ 完结会关闭当前内部 Observable" });
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
