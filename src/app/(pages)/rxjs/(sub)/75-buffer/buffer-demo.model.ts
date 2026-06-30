import { BehaviorSubject, buffer, concat, delay, of, type Subscription, tap, timer } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 buffer 如何用 notifier$ 输出缓存数组",
  operatorLabel: "source$.pipe(buffer(notifier$))",
  sourceValues: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5, 6, 7];

export class BufferDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({ ...INITIAL_STATE, running: true, status: "notifier$ 每 4000ms 发值，buffer 输出当前缓存数组并重新开始缓存" });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let bufferIndex = 0;

    const notifier$ = timer(4000, 4000);
    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，buffer 暂存它`,
        });
      }),
      buffer(notifier$),
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
          status: `${output.label} 被 notifier$ 触发输出 [${output.values.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false, status: "buffer 完成：source$ 完结会输出最后的缓存数组" });
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
