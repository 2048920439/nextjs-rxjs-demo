import { BehaviorSubject, concat, interval, map, type Subscription, take } from "rxjs";

export type ConcatLogItem = {
  stream: "source1" | "source2" | "source3" | "system";
  value: string;
};

export type ConcatDemoState = {
  running: boolean;
  status: string;
  logs: ConcatLogItem[];
};

const INITIAL_STATE: ConcatDemoState = {
  running: false,
  status: "点击运行，观察 concat 的顺序串联",
  logs: [],
};

function buildSource(prefix: string, intervalMs: number, count: number, label: ConcatLogItem["stream"]) {
  return interval(intervalMs).pipe(
    take(count),
    map((index) => ({
      stream: label,
      value: `${prefix}${index + 1}`,
    })),
  );
}

export class ConcatDemoModel {
  private readonly stateSubject = new BehaviorSubject<ConcatDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "source1$ 订阅中",
      logs: [],
    });

    const source1$ = buildSource("A", 500, 3, "source1");
    const source2$ = buildSource("B", 240, 3, "source2");
    const source3$ = buildSource("C", 180, 2, "source3");
    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    this.subscription = concat(source1$, source2$, source3$).subscribe({
      next: (item) => {
        this.appendLog(item);

        if (item.stream === "source1" && item.value === "A1") {
          this.patchState({ status: "source1$ 正在输出，source2$ 已创建但还没开始订阅" });
        } else if (item.stream === "source1" && item.value === "A3") {
          this.patchState({ status: "source1$ 已完成，开始订阅 source2$" });
        } else if (item.stream === "source2" && item.value === "B1") {
          this.patchState({ status: "source2$ 开始输出，但它之前一直在等待 source1$ complete" });
        } else if (item.stream === "source3" && item.value === "C1") {
          this.patchState({ status: "source3$ 接力开始，整个 concat 链继续顺序推进" });
        }
      },
      complete: () => {
        this.appendLog({ stream: "system", value: `complete at ${stamp()}` });
        this.subscription = null;
        this.patchState({
          running: false,
          status: "concat 已完成：三个流按顺序串联结束",
        });
      },
      error: (error) => {
        this.appendLog({ stream: "system", value: `error: ${String(error)}` });
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，串联终止",
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

  private appendLog(item: ConcatLogItem) {
    this.patchState({ logs: [...this.state.logs, item] });
  }

  private patchState(patch: Partial<ConcatDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
