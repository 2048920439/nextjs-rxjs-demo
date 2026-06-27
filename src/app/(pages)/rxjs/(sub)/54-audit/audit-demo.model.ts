import { audit, BehaviorSubject, interval, map, Subject, type Subscription, takeUntil, tap, timer } from "rxjs";

export type AuditValue = {
  value: string;
  state: "pending" | "dropped" | "passed";
  at: string;
};

export type AuditOutput = {
  value: string;
  at: string;
};

export type AuditDemoState = {
  running: boolean;
  windowOpen: boolean;
  pendingValue: string | null;
  status: string;
  sourceValues: AuditValue[];
  closes: string[];
  outputs: AuditOutput[];
};

const INITIAL_STATE: AuditDemoState = {
  running: false,
  windowOpen: false,
  pendingValue: null,
  status: "点击开始后，close$ 控制 audit 何时结束当前窗口",
  sourceValues: [],
  closes: [],
  outputs: [],
};

const RUN_MS = 9000;
const SOURCE_VALUES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export class AuditDemoModel {
  private readonly stateSubject = new BehaviorSubject<AuditDemoState>(INITIAL_STATE);
  private readonly closeSubject = new Subject<void>();
  private subscription: Subscription | null = null;
  private startAt = 0;
  private pendingIndex: number | null = null;
  private windowOpen = false;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  start() {
    this.subscription?.unsubscribe();
    this.startAt = Date.now();
    this.pendingIndex = null;
    this.windowOpen = false;
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "source$ 每 650ms 发值；第一个值打开 audit 窗口，close$ 决定何时输出窗口最后值",
    });

    const stop$ = timer(RUN_MS);
    const source$ = interval(650).pipe(
      map((index) => SOURCE_VALUES[index % SOURCE_VALUES.length]),
      tap((value) => {
        const previous = this.pendingIndex;
        const current = this.state.sourceValues.length;
        const opensWindow = !this.windowOpen;
        this.windowOpen = true;
        this.pendingIndex = current;

        this.patchState({
          windowOpen: true,
          pendingValue: value,
          sourceValues: [
            ...this.state.sourceValues.map((item, index) => (index === previous && item.state === "pending" ? { ...item, state: "dropped" as const } : item)),
            { value, state: "pending", at: this.stamp() },
          ],
          status: opensWindow ? `${value} 打开 audit 窗口，等待 close$` : `${value} 成为当前窗口最新候选值`,
        });
      }),
      audit(() => this.closeSubject),
      takeUntil(stop$),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        const emittedIndex = this.pendingIndex;
        this.pendingIndex = null;
        this.windowOpen = false;
        this.patchState({
          windowOpen: false,
          pendingValue: null,
          sourceValues: this.state.sourceValues.map((item, index) =>
            index === emittedIndex && item.state === "pending" ? { ...item, state: "passed" } : item,
          ),
          outputs: [...this.state.outputs, { value, at: this.stamp() }],
          status: `close$ 发出信号，audit 输出窗口最后值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.pendingIndex = null;
        this.windowOpen = false;
        this.patchState({
          running: false,
          windowOpen: false,
          pendingValue: null,
          status: "audit 演示结束：未被 close$ 结束的窗口不会额外补发值",
        });
      },
      error: () => {
        this.subscription = null;
        this.pendingIndex = null;
        this.windowOpen = false;
        this.patchState({
          running: false,
          windowOpen: false,
          pendingValue: null,
          status: "发生错误，audit 演示终止",
        });
      },
    });
  }

  closeWindow() {
    if (!this.state.running || !this.windowOpen) return;

    this.patchState({
      closes: [...this.state.closes, this.stamp()],
      status: "close$ 发出窗口结束信号",
    });
    this.closeSubject.next();
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.pendingIndex = null;
    this.windowOpen = false;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private stamp() {
    return `${Date.now() - this.startAt}ms`;
  }

  private patchState(patch: Partial<AuditDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
