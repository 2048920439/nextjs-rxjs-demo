import { BehaviorSubject, bufferToggle, concat, delay, of, type Subscription, take, tap, timer } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 bufferToggle 如何由 openings$ 和 closingSelector 输出数组",
  operatorLabel: "source$.pipe(bufferToggle(openings$, (x) => timer(x % 2 === 0 ? 2000 : 1000)))",
  sourceValues: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export class BufferToggleDemoModel {
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
      status: "openings$ 开启 buffer；closingSelector 发值时输出对应数组",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let bufferIndex = 0;

    const openings$ = timer(0, 4000).pipe(take(3));
    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，只会进入当前打开的 buffer`,
        });
      }),
      bufferToggle(openings$, (opening) => timer(opening % 2 === 0 ? 200 : 100)),
    );

    this.subscription = result$.subscribe({
      next: (values) => {
        const output = {
          label: `buffer ${bufferIndex}`,
          values: values.map(String),
          at: stamp(),
        };
        bufferIndex += 1;

        this.patchState({
          outputs: [...this.state.outputs, output],
          status: `${output.label} 关闭并输出 [${output.values.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false, status: "bufferToggle 完成：下游收到的是 opening 区间内的数组" });
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
