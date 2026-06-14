import { BehaviorSubject, defer, finalize, interval, map, repeatWhen, type Subscription, take, timer } from "rxjs";

export type RepeatWhenLogEntry = {
  type: "sub" | "unsub" | "next" | "complete";
  text: string;
};

export type RepeatWhenDemoState = {
  delay: number;
  running: boolean;
  round: number;
  logs: RepeatWhenLogEntry[];
};

const INITIAL_STATE: RepeatWhenDemoState = {
  delay: 2000,
  running: false,
  round: 0,
  logs: [],
};

export class RepeatWhenDemoModel {
  private readonly stateSubject = new BehaviorSubject<RepeatWhenDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  setDelay(delay: number) {
    this.patchState({ delay });
  }

  start() {
    this.subscription?.unsubscribe();
    this.patchState({ logs: [], round: 0, running: true });

    const source$ = defer(() => {
      this.addLog("sub", "on subscribe");

      return timer(0, 500).pipe(
        take(3),
        map((index) => index + 1),
        finalize(() => this.addLog("unsub", "on unsubscribe")),
      );
    });

    const repeated$ = source$.pipe(repeatWhen(() => interval(this.state.delay)));
    let currentRound = 0;

    this.subscription = repeated$.subscribe({
      next: (value) => {
        if (value === 1) {
          currentRound += 1;
          this.patchState({ round: currentRound });
        }
        this.addLog("next", `第 ${currentRound} 轮：${value}`);
      },
      complete: () => {
        this.addLog("complete", "complete");
        this.subscription = null;
        this.patchState({ running: false });
      },
    });
  }

  stop() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.patchState({ running: false });
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private addLog(type: RepeatWhenLogEntry["type"], text: string) {
    this.patchState({ logs: [...this.state.logs, { type, text }] });
  }

  private patchState(patch: Partial<RepeatWhenDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
