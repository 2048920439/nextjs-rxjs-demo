import { BehaviorSubject, bufferTime, type Subscription, take, tap, timer } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 bufferTime 如何按时间输出数组",
  operatorLabel: "source$.pipe(bufferTime(4000))",
  sourceValues: [],
  outputs: [],
};

export class BufferTimeDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({ ...INITIAL_STATE, running: true, status: "bufferTime 会先缓存 4000ms 内的值，再一次性输出数组" });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let bufferIndex = 0;

    const result$ = timer(0, 1000).pipe(
      take(8),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，bufferTime 暂存它`,
        });
      }),
      bufferTime(4000),
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
          status: `${output.label} 输出数组 [${output.values.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false, status: "bufferTime 完成：下游收到的是数组，而不是内部 Observable" });
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
