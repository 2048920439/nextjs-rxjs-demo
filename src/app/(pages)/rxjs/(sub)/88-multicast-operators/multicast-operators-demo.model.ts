import {
  BehaviorSubject,
  type ConnectableObservable,
  defer,
  interval,
  multicast,
  type Observable,
  publish,
  refCount,
  share,
  Subject,
  Subscription,
  take,
  tap,
} from "rxjs";

export type MulticastOperatorMode = "multicast" | "publish" | "share";
export type DemoObserver = "observer 1" | "observer 2";

export type SourceEvent = {
  type: "subscribe" | "next" | "complete";
  cycle: number;
  value: number | null;
  at: string;
};

export type ObserverEvent = {
  observer: DemoObserver;
  type: "subscribe" | "next" | "complete";
  value: number | null;
  at: string;
};

export type MulticastOperatorsDemoState = {
  running: boolean;
  mode: MulticastOperatorMode;
  status: string;
  sourceEvents: SourceEvent[];
  observerEvents: ObserverEvent[];
};

const INITIAL_STATE: MulticastOperatorsDemoState = {
  running: false,
  mode: "multicast",
  status: "选择一个多播操作符，观察上游订阅次数和两个 Observer 的输出差异。",
  sourceEvents: [],
  observerEvents: [],
};

const MODE_INTRO: Record<MulticastOperatorMode, string> = {
  multicast: "multicast(new Subject()) 返回 ConnectableObservable；先挂 Observer，再调用 connect() 才会启动上游。",
  publish: "publish().refCount() 使用同一个 Subject；第一次完成后，这个 Subject 不能再给后来的 Observer 重新发值。",
  share: "share() 等价于“Subject 工厂 + refCount”的常见多播模式；完成后有新 Observer 时会重新订阅上游。",
};

export class MulticastOperatorsDemoModel {
  private readonly stateSubject = new BehaviorSubject<MulticastOperatorsDemoState>(INITIAL_STATE);
  private subscriptions = new Subscription();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private expectedCompletions = 0;
  private completedObservers = 0;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: MulticastOperatorMode) {
    this.stopActiveRun();
    this.expectedCompletions = 2;
    this.completedObservers = 0;
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: MODE_INTRO[mode],
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let sourceCycle = 0;
    const source$ = this.createSource$(stamp, () => {
      sourceCycle += 1;
      return sourceCycle;
    });

    if (mode === "multicast") {
      const tick$ = source$.pipe(multicast(new Subject<number>())) as ConnectableObservable<number>;

      this.subscribeObserver("observer 1", tick$, stamp);
      this.schedule(() => this.subscribeObserver("observer 2", tick$, stamp), 1500);
      this.schedule(() => {
        this.patchState({
          status: "connect() 已调用；上游 source$ 开始执行，后加入的 observer 2 会错过已经发出的值。",
        });
        this.subscriptions.add(tick$.connect());
      }, 0);
      return;
    }

    const shared$ = mode === "publish" ? source$.pipe(publish(), refCount()) : source$.pipe(share());

    this.subscribeObserver("observer 1", shared$, stamp);
    this.schedule(() => this.subscribeObserver("observer 2", shared$, stamp), 5000);
  }

  reset() {
    this.stopActiveRun();
    this.expectedCompletions = 0;
    this.completedObservers = 0;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.stopActiveRun();
  }

  private createSource$(stamp: () => string, nextCycle: () => number) {
    return defer(() => {
      const cycle = nextCycle();
      this.addSourceEvent({
        type: "subscribe",
        cycle,
        value: null,
        at: stamp(),
      });

      return interval(1000).pipe(
        take(3),
        tap({
          next: (value) => {
            this.addSourceEvent({
              type: "next",
              cycle,
              value,
              at: stamp(),
            });
          },
          complete: () => {
            this.addSourceEvent({
              type: "complete",
              cycle,
              value: null,
              at: stamp(),
            });
          },
        }),
      );
    });
  }

  private subscribeObserver(observer: DemoObserver, source$: Observable<number>, stamp: () => string) {
    this.addObserverEvent({
      observer,
      type: "subscribe",
      value: null,
      at: stamp(),
    });

    const subscription = source$.subscribe({
      next: (value) => {
        this.addObserverEvent({
          observer,
          type: "next",
          value,
          at: stamp(),
        });
      },
      complete: () => {
        this.addObserverEvent({
          observer,
          type: "complete",
          value: null,
          at: stamp(),
        });
        this.completedObservers += 1;

        if (this.completedObservers >= this.expectedCompletions) {
          this.patchState({
            running: false,
            status: this.getCompleteStatus(this.state.mode),
          });
        }
      },
    });

    this.subscriptions.add(subscription);
  }

  private addSourceEvent(event: SourceEvent) {
    const status =
      event.type === "subscribe"
        ? `source$ 第 ${event.cycle} 次被订阅`
        : event.type === "complete"
          ? `source$ 第 ${event.cycle} 次订阅完成`
          : `source$ 第 ${event.cycle} 次订阅发出 ${event.value}`;

    this.patchState({
      sourceEvents: [...this.state.sourceEvents, event],
      status,
    });
  }

  private addObserverEvent(event: ObserverEvent) {
    const status =
      event.type === "subscribe"
        ? `${event.observer} 开始订阅`
        : event.type === "complete"
          ? `${event.observer} 收到 complete`
          : `${event.observer} 收到 ${event.value}`;

    this.patchState({
      observerEvents: [...this.state.observerEvents, event],
      status,
    });
  }

  private getCompleteStatus(mode: MulticastOperatorMode) {
    if (mode === "multicast") {
      return "multicast 演示完成：两个 Observer 共享同一次上游订阅，observer 2 错过了 connect 后已经发出的 0。";
    }

    if (mode === "publish") {
      return "publish 演示完成：后来的 observer 2 只收到 complete，唯一 Subject 已经结束，不能重用。";
    }

    return "share 演示完成：observer 2 触发了第二次上游订阅，因此重新收到 0、1、2。";
  }

  private schedule(callback: () => void, delayMs: number) {
    const timer = setTimeout(callback, delayMs);
    this.timers.push(timer);
  }

  private stopActiveRun() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  private patchState(patch: Partial<MulticastOperatorsDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
