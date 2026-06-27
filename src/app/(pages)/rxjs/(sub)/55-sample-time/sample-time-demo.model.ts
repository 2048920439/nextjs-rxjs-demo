import { BehaviorSubject, concat, delay, of, sampleTime, type Subscription, tap } from "rxjs";

export type SampleTimeValue = {
  value: string;
  state: "latest" | "sampled" | "stale";
  at: string;
};

export type SampleTimeOutput = {
  value: string;
  at: string;
};

export type SampleTimeDemoState = {
  running: boolean;
  status: string;
  sourceValues: SampleTimeValue[];
  outputs: SampleTimeOutput[];
};

const INITIAL_STATE: SampleTimeDemoState = {
  running: false,
  status: "点击运行，观察 sampleTime 如何按固定节拍采样最新值",
  sourceValues: [],
  outputs: [],
};

const PERIOD_MS = 800;
const EVENTS = [
  { value: "A", delayMs: 500 },
  { value: "A", delayMs: 500 },
  { value: "B", delayMs: 1000 },
  { value: "B", delayMs: 1000 },
  { value: "B", delayMs: 1000 },
  { value: "C", delayMs: 500 },
  { value: "C", delayMs: 500 },
  { value: "C", delayMs: 500 },
];

export class SampleTimeDemoModel {
  private readonly stateSubject = new BehaviorSubject<SampleTimeDemoState>(INITIAL_STATE);
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
      status: `sampleTime(${PERIOD_MS}) 使用独立于上游的固定采样节拍`,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let latestIndex: number | null = null;
    let nextIndex = 0;

    const source$ = concat(...EVENTS.map((event) => of(event.value).pipe(delay(event.delayMs)))).pipe(
      tap((value) => {
        const previous = latestIndex;
        const current = nextIndex;
        nextIndex += 1;
        latestIndex = current;

        this.patchState({
          sourceValues: [
            ...this.state.sourceValues.map((item, index) => (index === previous && item.state === "latest" ? { ...item, state: "stale" as const } : item)),
            { value, state: "latest", at: stamp() },
          ],
          status: `${value} 成为当前最新值，等待下一个采样点`,
        });
      }),
      sampleTime(PERIOD_MS),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        const sampledIndex = latestIndex;
        latestIndex = null;
        this.patchState({
          sourceValues: this.state.sourceValues.map((item, index) =>
            index === sampledIndex && item.state === "latest" ? { ...item, state: "sampled" } : item,
          ),
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `采样点到达，sampleTime 输出最新值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "sampleTime 完成：没有新值的采样点不会输出",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，sampleTime 演示终止",
        });
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

  private patchState(patch: Partial<SampleTimeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
