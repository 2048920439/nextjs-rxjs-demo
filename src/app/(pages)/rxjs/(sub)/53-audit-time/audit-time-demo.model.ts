import { auditTime, BehaviorSubject, interval, type Subscription, take, tap } from "rxjs";

export type AuditTimeValue = {
  value: number;
  state: "pending" | "dropped" | "passed";
  at: string;
};

export type AuditTimeOutput = {
  value: number;
  at: string;
};

export type AuditTimeDemoState = {
  running: boolean;
  status: string;
  sourceValues: AuditTimeValue[];
  outputs: AuditTimeOutput[];
};

const INITIAL_STATE: AuditTimeDemoState = {
  running: false,
  status: "点击运行，观察 auditTime 如何在窗口结束时输出最后一个值",
  sourceValues: [],
  outputs: [],
};

const SOURCE_INTERVAL_MS = 450;
const WINDOW_MS = 900;

export class AuditTimeDemoModel {
  private readonly stateSubject = new BehaviorSubject<AuditTimeDemoState>(INITIAL_STATE);
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
      status: `source$ 每 ${SOURCE_INTERVAL_MS}ms 发值，auditTime(${WINDOW_MS}) 会等窗口结束再输出最后一个值`,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let pendingValue: number | null = null;

    const source$ = interval(SOURCE_INTERVAL_MS).pipe(
      take(8),
      tap((value) => {
        const previous = pendingValue;
        pendingValue = value;

        this.patchState({
          sourceValues: [
            ...this.state.sourceValues.map((item) => (item.value === previous && item.state === "pending" ? { ...item, state: "dropped" as const } : item)),
            { value, state: "pending", at: stamp() },
          ],
          status: previous === null ? `${value} 开启一个审计窗口，暂存为候选值` : `${value} 替换窗口内上一个候选值 ${previous}`,
        });
      }),
      auditTime(WINDOW_MS),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        pendingValue = null;
        this.patchState({
          sourceValues: this.state.sourceValues.map((item) => (item.value === value && item.state === "pending" ? { ...item, state: "passed" } : item)),
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `${WINDOW_MS}ms 窗口结束，auditTime 输出最后一个候选值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "auditTime 完成：窗口中的最后一个值已输出",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，auditTime 演示终止",
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

  private patchState(patch: Partial<AuditTimeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
