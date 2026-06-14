import { BehaviorSubject, type Subscription } from "rxjs";
import { ajax } from "rxjs/ajax";

export type DelayResponse = {
  success: boolean;
  delay: number;
};

export type AjaxDemoState = {
  delayMs: number;
  loading: boolean;
  result: DelayResponse | null;
  error: string | null;
};

const INITIAL_STATE: AjaxDemoState = {
  delayMs: 1500,
  loading: false,
  result: null,
  error: null,
};

export class AjaxDemoModel {
  private readonly stateSubject = new BehaviorSubject<AjaxDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  setDelay(delayMs: number) {
    this.patchState({ delayMs });
  }

  fetch() {
    this.subscription?.unsubscribe();
    this.patchState({
      loading: true,
      error: null,
      result: null,
    });

    this.subscription = ajax.getJSON<DelayResponse>(`/api/mock/delay?ms=${this.state.delayMs}`).subscribe({
      next: (result) => {
        this.patchState({ result });
      },
      error: (error) => {
        this.subscription = null;
        this.patchState({
          loading: false,
          error: error?.message || "请求失败",
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ loading: false });
      },
    });
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private patchState(patch: Partial<AjaxDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
