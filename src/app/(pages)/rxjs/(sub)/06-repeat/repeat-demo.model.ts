import { BehaviorSubject, Observable, repeat, type Subscription } from "rxjs";

export type RepeatLogEntry = {
  type: "sub" | "unsub" | "next" | "complete";
  text: string;
};

export type RepeatDemoState = {
  repeatCount: number;
  running: boolean;
  round: number;
  logs: RepeatLogEntry[];
};

const INITIAL_STATE: RepeatDemoState = {
  repeatCount: 2,
  running: false,
  round: 0,
  logs: [],
};

export class RepeatDemoModel {
  private readonly stateSubject = new BehaviorSubject<RepeatDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  setRepeatCount(repeatCount: number) {
    this.patchState({ repeatCount });
  }

  start() {
    this.subscription?.unsubscribe();
    this.patchState({ logs: [], round: 0, running: true });

    const source$ = new Observable<number>((subscriber) => {
      this.addLog("sub", "source$ subscribe");
      subscriber.next(1);
      subscriber.next(2);
      subscriber.next(3);
      subscriber.complete();

      return () => {
        this.addLog("unsub", "source$ unsubscribe");
      };
    });

    let currentRound = 0;
    this.subscription = source$.pipe(repeat(this.state.repeatCount)).subscribe({
      next: (value) => {
        if (value === 1) {
          currentRound += 1;
          this.patchState({ round: currentRound });
        }
        this.addLog("next", `round ${currentRound}: ${value}`);
      },
      complete: () => {
        this.addLog("complete", "repeated$ complete");
        this.subscription = null;
        this.patchState({ running: false });
      },
    });
  }

  cancel() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.addLog("unsub", "manual unsubscribe");
    this.patchState({ running: false });
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private addLog(type: RepeatLogEntry["type"], text: string) {
    this.patchState({ logs: [...this.state.logs, { type, text }] });
  }

  private patchState(patch: Partial<RepeatDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
