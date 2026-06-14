import { BehaviorSubject, fromEventPattern, type Subscription } from "rxjs";

export type PatternLogEntry = {
  type: "val" | "note";
  text: string;
};

export type PatternDemoState = {
  subscribed: boolean;
  logs: PatternLogEntry[];
};

const INITIAL_STATE: PatternDemoState = {
  subscribed: false,
  logs: [],
};

export class PatternDemoModel {
  private readonly stateSubject = new BehaviorSubject<PatternDemoState>(INITIAL_STATE);
  private readonly listeners = new Set<(value: string) => void>();
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  subscribe() {
    this.subscription?.unsubscribe();
    this.patchState({ logs: [], subscribed: true });

    const source$ = fromEventPattern<string>(
      (handler) => this.addHandler(handler),
      (handler) => this.removeHandler(handler),
    );

    this.subscription = source$.subscribe({
      next: (value) => this.addLog("val", `next: ${value}`),
    });
  }

  emit() {
    const value = `msg-${Date.now().toString().slice(-4)}`;
    this.listeners.forEach((listener) => listener(value));
  }

  unsubscribe() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.patchState({ subscribed: false });
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private addHandler(handler: (value: string) => void) {
    this.listeners.add(handler);
    this.addLog("note", "addHandler");
  }

  private removeHandler(handler: (value: string) => void) {
    this.listeners.delete(handler);
    this.addLog("note", "removeHandler");
  }

  private addLog(type: PatternLogEntry["type"], text: string) {
    this.patchState({ logs: [...this.state.logs, { type, text }] });
  }

  private patchState(patch: Partial<PatternDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
