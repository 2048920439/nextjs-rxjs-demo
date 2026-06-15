import { BehaviorSubject, finalize, map, race, type Subscription, take, tap, timer } from "rxjs";

export type RaceSourceKey = "source1" | "source2";

export type RaceEvent = {
  source: RaceSourceKey;
  value: string;
  at: string;
};

export type RaceDemoState = {
  running: boolean;
  status: string;
  winner: RaceSourceKey | null;
  source1Status: string;
  source2Status: string;
  source1Values: RaceEvent[];
  source2Values: RaceEvent[];
  outputs: RaceEvent[];
};

const INITIAL_STATE: RaceDemoState = {
  running: false,
  status: "点击运行，观察 race 如何选择第一个发值的 Observable",
  winner: null,
  source1Status: "等待订阅",
  source2Status: "等待订阅",
  source1Values: [],
  source2Values: [],
  outputs: [],
};

const sourceLabel = (source: RaceSourceKey) => (source === "source1" ? "source1$" : "source2$");

export class RaceDemoModel {
  private readonly stateSubject = new BehaviorSubject<RaceDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "race 同时订阅两个来源，等待第一条数据出现",
      winner: null,
      source1Status: "已订阅：500ms 后发出第一条，之后每 2000ms 一条",
      source2Status: "已订阅：1000ms 后发出第一条，之后每 1000ms 一条",
      source1Values: [],
      source2Values: [],
      outputs: [],
    });

    const startAt = Date.now();
    const source1$ = this.createSource({
      source: "source1",
      firstDelay: 500,
      period: 2000,
      suffix: "a",
      count: 4,
      startAt,
    });
    const source2$ = this.createSource({
      source: "source2",
      firstDelay: 1000,
      period: 1000,
      suffix: "b",
      count: 4,
      startAt,
    });

    this.subscription = race(source1$, source2$).subscribe({
      next: (event) => {
        this.patchState({
          outputs: [...this.state.outputs, event],
          status: `race 输出 ${event.value}：只转发 ${sourceLabel(event.source)} 的数据`,
        });
      },
      complete: () => {
        const { winner } = this.state;

        this.subscription = null;
        this.patchState({
          running: false,
          status: winner ? `race 完成：输出流跟随 ${sourceLabel(winner)} 一起完成` : "race 完成",
          source1Status: winner === "source1" ? "胜者完成：race 随之 complete" : this.state.source1Status,
          source2Status: winner === "source2" ? "胜者完成：race 随之 complete" : this.state.source2Status,
        });
      },
      error: (error) => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `发生错误：${String(error)}`,
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

  private createSource(config: { source: RaceSourceKey; firstDelay: number; period: number; suffix: "a" | "b"; count: number; startAt: number }) {
    return timer(config.firstDelay, config.period).pipe(
      take(config.count),
      map((index) => ({
        source: config.source,
        value: `${index}${config.suffix}`,
        at: `${Date.now() - config.startAt}ms`,
      })),
      tap((event) => this.recordSourceValue(event)),
      finalize(() => this.markSourceFinalized(config.source)),
    );
  }

  private recordSourceValue(event: RaceEvent) {
    const firstWinner = this.state.winner === null;
    const patch: Partial<RaceDemoState> = {
      ...(event.source === "source1"
        ? {
            source1Values: [...this.state.source1Values, event],
            source1Status: firstWinner ? `首先发出 ${event.value}，成为胜者` : `继续发出 ${event.value}`,
          }
        : {
            source2Values: [...this.state.source2Values, event],
            source2Status: firstWinner ? `首先发出 ${event.value}，成为胜者` : `继续发出 ${event.value}`,
          }),
    };

    if (firstWinner) {
      patch.winner = event.source;
      patch.status = `${sourceLabel(event.source)} 首先发出 ${event.value}，race 锁定胜者`;
    }

    this.patchState(patch);
  }

  private markSourceFinalized(source: RaceSourceKey) {
    const { winner } = this.state;

    if (!winner || winner === source) return;

    const emittedCount = source === "source1" ? this.state.source1Values.length : this.state.source2Values.length;
    const finalStatus = emittedCount === 0 ? "被 race 退订：没有机会发出任何值" : "被 race 退订：后续值被取消";

    this.patchState(source === "source1" ? { source1Status: finalStatus } : { source2Status: finalStatus });
  }

  private patchState(patch: Partial<RaceDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
