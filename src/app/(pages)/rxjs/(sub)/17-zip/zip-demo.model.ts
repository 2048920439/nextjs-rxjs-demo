import { BehaviorSubject, interval, map, type Subscription, take, tap, zip } from "rxjs";

export type ZipPairItem = {
  left: number;
  right: string;
};

export type ZipDemoState = {
  running: boolean;
  status: string;
  leftValues: number[];
  rightValues: string[];
  pairs: ZipPairItem[];
};

const INITIAL_STATE: ZipDemoState = {
  running: false,
  status: "点击运行，观察 zip 的一对一配对",
  leftValues: [],
  rightValues: [],
  pairs: [],
};

export class ZipDemoModel {
  private readonly stateSubject = new BehaviorSubject<ZipDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "左流更快，开始积压等待配对",
      leftValues: [],
      rightValues: [],
      pairs: [],
    });

    const left$ = interval(350).pipe(
      take(5),
      map((index) => index + 1),
      tap((value) => {
        this.patchState({ leftValues: [...this.state.leftValues, value] });
      }),
    );

    const right$ = interval(1000).pipe(
      take(4),
      map((index) => String.fromCharCode(65 + index)),
      tap((value) => {
        this.patchState({ rightValues: [...this.state.rightValues, value] });
      }),
    );

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    this.subscription = zip(left$, right$).subscribe({
      next: ([left, right]) => {
        this.patchState({
          pairs: [...this.state.pairs, { left, right }],
          status: `配对完成：${left} -> ${right}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `zip 完成：最短流结束后收工，extra buffer 将被丢弃（${stamp()}）`,
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

  private patchState(patch: Partial<ZipDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
