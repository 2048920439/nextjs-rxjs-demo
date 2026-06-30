import { BehaviorSubject, concat, delay, map, mergeMap, of, type Subscription, take, tap, timer, toArray, windowToggle } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 windowToggle 如何由 openings$ 和 closingSelector 控制窗口",
  operatorLabel: "source$.pipe(windowToggle(openings$, (x) => timer(x % 2 === 0 ? 2000 : 1000)))",
  sourceValues: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export class WindowToggleDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "openings$ 每 4000ms 开启一个窗口；偶数 opening 开 2000ms，奇数 opening 开 1000ms",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let windowIndex = 0;

    const openings$ = timer(0, 4000).pipe(take(3));
    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，只有打开中的窗口会接收它`,
        });
      }),
      windowToggle(openings$, (opening) => timer(opening % 2 === 0 ? 200 : 100)),
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
          status: `${output.label} 关闭，内容是 [${output.values.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false, status: "windowToggle 完成：opening 和 closingSelector 完整控制窗口开关" });
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
