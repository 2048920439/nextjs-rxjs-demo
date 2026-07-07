import { asapScheduler, BehaviorSubject, observeOn, range, type Subscription } from "rxjs";

export type SchedulerRoleMode = "sync" | "asap";

export type SchedulerRoleLog = {
  order: number;
  text: string;
  phase: "caller" | "observer" | "complete";
  at: string;
};

export type SchedulerRoleDemoState = {
  running: boolean;
  mode: SchedulerRoleMode;
  status: string;
  logs: SchedulerRoleLog[];
};

const INITIAL_STATE: SchedulerRoleDemoState = {
  running: false,
  mode: "sync",
  status: "选择一种执行方式，观察 subscribe 前后日志和 Observer 输出的先后顺序。",
  logs: [],
};

const MODE_STATUS: Record<SchedulerRoleMode, string> = {
  sync: "不指定 scheduler 时，range 会在 subscribe 调用栈里同步吐出所有值。",
  asap: "使用 asapScheduler 后，Observer 通知被安排到当前同步代码之后执行。",
};

export class SchedulerRoleDemoModel {
  private readonly stateSubject = new BehaviorSubject<SchedulerRoleDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;
  private order = 0;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: SchedulerRoleMode) {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.order = 0;

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: MODE_STATUS[mode],
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    const source$ = mode === "sync" ? range(1, 3) : range(1, 3).pipe(observeOn(asapScheduler));

    this.addLog("before subscribe", "caller", stamp());

    const subscription = source$.subscribe({
      next: (value) => {
        this.addLog(`data: ${value}`, "observer", stamp());
      },
      complete: () => {
        this.addLog("complete", "complete", stamp());
        this.patchState({
          running: false,
          status:
            mode === "sync"
              ? "同步模式完成：Observer 输出挡在 after subscribe 前面。"
              : "asapScheduler 模式完成：after subscribe 先执行，Observer 输出随后到达。",
        });
      },
      error: () => {
        this.patchState({
          running: false,
          status: "示例发生错误，当前演示已停止。",
        });
      },
    });

    this.subscription = subscription.closed ? null : subscription;
    this.addLog("after subscribe", "caller", stamp());

    if (mode === "sync") {
      this.patchState({
        running: false,
        status: "同步模式完成：after subscribe 是最后一条日志。",
      });
    }
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.order = 0;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private addLog(text: string, phase: SchedulerRoleLog["phase"], at: string) {
    this.order += 1;

    this.patchState({
      logs: [
        ...this.state.logs,
        {
          order: this.order,
          text,
          phase,
          at,
        },
      ],
    });
  }

  private patchState(patch: Partial<SchedulerRoleDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
