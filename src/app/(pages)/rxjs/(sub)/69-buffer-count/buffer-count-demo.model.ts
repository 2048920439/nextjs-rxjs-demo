import { BehaviorSubject, bufferCount, concat, delay, of, type Subscription, tap } from "rxjs";

import type { WindowBufferDemoState } from "../_window-buffer/window-buffer-demo";

const INITIAL_STATE: WindowBufferDemoState = {
  running: false,
  status: "运行示例，观察 bufferCount 如何按数量输出数组",
  operatorLabel: "source$.pipe(bufferCount(4))",
  sourceValues: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export class BufferCountDemoModel {
  private readonly stateSubject = new BehaviorSubject<WindowBufferDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({ ...INITIAL_STATE, running: true, status: "bufferCount(4) 每缓存 4 个值就输出一个数组" });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let bufferIndex = 0;

    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，bufferCount 暂存它`,
        });
      }),
      bufferCount(4),
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
        this.patchState({ running: false, status: "bufferCount 完成：最后不足 4 个值也会作为数组输出" });
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
