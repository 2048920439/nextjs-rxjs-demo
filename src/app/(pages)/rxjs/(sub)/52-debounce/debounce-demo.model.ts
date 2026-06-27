import { BehaviorSubject, debounce, interval, Subject, type Subscription, takeUntil, tap, timer } from "rxjs";

export type DebounceValue = {
  value: number;
  state: "pending" | "dropped" | "passed";
  at: string;
};

export type DebounceOutput = {
  value: number;
  at: string;
};

export type DebounceDemoState = {
  running: boolean;
  pendingValue: number | null;
  status: string;
  sourceValues: DebounceValue[];
  flushes: string[];
  outputs: DebounceOutput[];
};

const INITIAL_STATE: DebounceDemoState = {
  running: false,
  pendingValue: null,
  status: "点击开始后，flush$ 控制 debounce 何时确认最新值",
  sourceValues: [],
  flushes: [],
  outputs: [],
};

const RUN_MS = 9000;
const SOURCE_INTERVAL_MS = 650;

export class DebounceDemoModel {
  private readonly stateSubject = new BehaviorSubject<DebounceDemoState>(INITIAL_STATE);
  private readonly flushSubject = new Subject<void>();
  private subscription: Subscription | null = null;
  private startAt = 0;
  private pendingIndex: number | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  start() {
    this.subscription?.unsubscribe();
    this.startAt = Date.now();
    this.pendingIndex = null;
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "source$ 每 650ms 发值；debounce 只缓存最新值，等待 flush$ 确认",
    });

    const stop$ = timer(RUN_MS);
    const source$ = interval(SOURCE_INTERVAL_MS).pipe(
      tap((value) => {
        const previous = this.pendingIndex;
        const current = this.state.sourceValues.length;
        this.pendingIndex = current;

        this.patchState({
          pendingValue: value,
          sourceValues: [
            ...this.state.sourceValues.map((item, index) => (index === previous && item.state === "pending" ? { ...item, state: "dropped" as const } : item)),
            { value, state: "pending", at: this.stamp() },
          ],
          status: previous === null ? `${value} 成为等待确认的最新值` : `${value} 替换上一个等待值，旧值被 debounce 丢弃`,
        });
      }),
      debounce(() => this.flushSubject),
      takeUntil(stop$),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        const emittedIndex = this.pendingIndex;
        this.pendingIndex = null;
        this.patchState({
          pendingValue: null,
          sourceValues: this.state.sourceValues.map((item, index) =>
            index === emittedIndex && item.state === "pending" ? { ...item, state: "passed" } : item,
          ),
          outputs: [...this.state.outputs, { value, at: this.stamp() }],
          status: `flush$ 发出信号，debounce 输出当前最新值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.pendingIndex = null;
        this.patchState({
          running: false,
          pendingValue: null,
          status: "debounce 演示结束：flush$ 决定了缓存值何时进入下游",
        });
      },
      error: () => {
        this.subscription = null;
        this.pendingIndex = null;
        this.patchState({
          running: false,
          pendingValue: null,
          status: "发生错误，debounce 演示终止",
        });
      },
    });
  }

  flush() {
    if (!this.state.running || this.pendingIndex === null) return;

    this.patchState({
      flushes: [...this.state.flushes, this.stamp()],
      status: "flush$ 发出确认信号",
    });
    this.flushSubject.next();
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.pendingIndex = null;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private stamp() {
    return `${Date.now() - this.startAt}ms`;
  }

  private patchState(patch: Partial<DebounceDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
