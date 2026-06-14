import { BehaviorSubject, generate, Observable, of, range } from "rxjs";

export type SyncTabKey = "create" | "of" | "range" | "generate";

export type SyncLogEntry = {
  type: "next" | "complete" | "error";
  value?: string;
};

export type SyncDemoState = {
  activeTab: SyncTabKey;
  running: boolean;
  logs: SyncLogEntry[];
};

const INITIAL_STATE: SyncDemoState = {
  activeTab: "of",
  running: false,
  logs: [],
};

export class SyncDemoModel {
  private readonly stateSubject = new BehaviorSubject<SyncDemoState>(INITIAL_STATE);

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(tab: SyncTabKey = this.state.activeTab) {
    this.patchState({ activeTab: tab, running: true, logs: [] });
    const logs: SyncLogEntry[] = [];

    try {
      this.sourceFor(tab).subscribe({
        next: (value) => logs.push({ type: "next", value: String(value) }),
        complete: () => {
          logs.push({ type: "complete" });
          this.patchState({ logs, running: false });
        },
        error: (error) => {
          logs.push({ type: "error", value: String(error) });
          this.patchState({ logs, running: false });
        },
      });
    } catch (error) {
      logs.push({ type: "error", value: String(error) });
      this.patchState({ logs, running: false });
    }
  }

  private sourceFor(tab: SyncTabKey): Observable<unknown> {
    switch (tab) {
      case "create":
        return new Observable((subscriber) => {
          subscriber.next(1);
          subscriber.next(2);
          subscriber.next(3);
          subscriber.complete();
        });
      case "of":
        return of(1, 2, 3);
      case "range":
        return range(1, 10);
      case "generate":
        return generate<number, number>({
          initialState: 2,
          condition: (value) => value < 10,
          iterate: (value) => value + 2,
          resultSelector: (value) => value * value,
        });
    }
  }

  private patchState(patch: Partial<SyncDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
