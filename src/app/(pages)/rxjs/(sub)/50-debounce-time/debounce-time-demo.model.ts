import { BehaviorSubject, concat, debounceTime, delay, of, type Subscription, tap } from "rxjs";

export type DebounceTimeValue = {
  value: string;
  state: "pending" | "dropped" | "passed";
  at: string;
};

export type DebounceTimeOutput = {
  value: string;
  at: string;
};

export type DebounceTimeDemoState = {
  running: boolean;
  status: string;
  sourceValues: DebounceTimeValue[];
  outputs: DebounceTimeOutput[];
};

const INITIAL_STATE: DebounceTimeDemoState = {
  running: false,
  status: "点击运行，观察 debounceTime 如何等待上游安静后才输出最新值",
  sourceValues: [],
  outputs: [],
};

const DUE_MS = 800;
const EVENTS = [
  { value: "A1", delayMs: 0 },
  { value: "A2", delayMs: 350 },
  { value: "B1", delayMs: 1100 },
  { value: "B2", delayMs: 1100 },
  { value: "C1", delayMs: 350 },
  { value: "C2", delayMs: 350 },
  { value: "C3", delayMs: 350 },
];

export class DebounceTimeDemoModel {
  private readonly stateSubject = new BehaviorSubject<DebounceTimeDemoState>(INITIAL_STATE);
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
      status: `debounceTime(${DUE_MS}) 会等待 ${DUE_MS}ms 没有新值，再输出最后一个值`,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let pendingValue: string | null = null;

    const source$ = concat(...EVENTS.map((event) => of(event.value).pipe(delay(event.delayMs)))).pipe(
      tap((value) => {
        const previous = pendingValue;
        pendingValue = value;

        this.patchState({
          sourceValues: [
            ...this.state.sourceValues.map((item) => (item.value === previous && item.state === "pending" ? { ...item, state: "dropped" as const } : item)),
            { value, state: "pending", at: stamp() },
          ],
          status: previous ? `${value} 到来，之前等待中的 ${previous} 被替换` : `${value} 到来，开始等待安静窗口`,
        });
      }),
      debounceTime(DUE_MS),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        pendingValue = null;
        this.patchState({
          sourceValues: this.state.sourceValues.map((item) => (item.value === value && item.state === "pending" ? { ...item, state: "passed" } : item)),
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `${value} 后面有足够长的安静时间，进入下游`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "debounceTime 完成：上游 complete 时，最后一个等待值也会被输出",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，debounceTime 演示终止",
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

  private patchState(patch: Partial<DebounceTimeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
