import { BehaviorSubject, interval, map, merge, type Subscription, take } from "rxjs";

export type MergeLogItem = {
  stream: "source1" | "source2" | "source3" | "system";
  value: string;
};

export type MergeDemoState = {
  running: boolean;
  status: string;
  logs: MergeLogItem[];
};

const INITIAL_STATE: MergeDemoState = {
  running: false,
  status: "点击运行，观察 merge 的交叉输出",
  logs: [],
};

function buildSource(prefix: string, intervalMs: number, count: number, label: MergeLogItem["stream"]) {
  return interval(intervalMs).pipe(
    take(count),
    map((index) => ({
      stream: label,
      value: `${prefix}${index + 1}`,
    })),
  );
}

export class MergeDemoModel {
  private readonly stateSubject = new BehaviorSubject<MergeDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "所有 source 已同时订阅",
      logs: [],
    });

    const source1$ = buildSource("A", 500, 4, "source1");
    const source2$ = buildSource("B", 240, 4, "source2");
    const source3$ = buildSource("C", 180, 3, "source3");
    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    this.subscription = merge(source1$, source2$, source3$).subscribe({
      next: (item) => {
        this.appendLog(item);

        if (item.stream === "source3" && item.value === "C1") {
          this.patchState({ status: "source3$ 先到，merge 先转发它" });
        } else if (item.stream === "source2" && item.value === "B1") {
          this.patchState({ status: "source2$ 也在并行输出，顺序取决于到达时间" });
        } else if (item.stream === "source1" && item.value === "A1") {
          this.patchState({ status: "source1$ 虽然更慢，但并不会被阻塞" });
        }
      },
      complete: () => {
        this.appendLog({ stream: "system", value: `complete at ${stamp()}` });
        this.subscription = null;
        this.patchState({
          running: false,
          status: "merge 已完成：三个流都 complete 之后整体结束",
        });
      },
      error: (error) => {
        this.appendLog({ stream: "system", value: `error: ${String(error)}` });
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，merge 链终止",
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

  private appendLog(item: MergeLogItem) {
    this.patchState({ logs: [...this.state.logs, item] });
  }

  private patchState(patch: Partial<MergeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
