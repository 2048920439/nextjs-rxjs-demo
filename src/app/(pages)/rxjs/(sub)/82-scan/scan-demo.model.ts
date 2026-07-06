import { BehaviorSubject, concat, delay, of, scan, type Subscription, tap } from "rxjs";

export type ScanSourceValue = {
  label: string;
  amount: number;
  at: string;
};

export type ScanSnapshot = {
  total: number;
  count: number;
  label: string;
  at: string;
};

export type ScanDemoState = {
  running: boolean;
  status: string;
  sourceValues: ScanSourceValue[];
  snapshots: ScanSnapshot[];
};

type CartState = {
  total: number;
  count: number;
  label: string;
};

const INITIAL_STATE: ScanDemoState = {
  running: false,
  status: "点击运行，观察 scan 如何把每个上游值累计成持续更新的状态",
  sourceValues: [],
  snapshots: [],
};

const INITIAL_CART: CartState = {
  total: 0,
  count: 0,
  label: "seed",
};

const ACTIONS = [
  { label: "加入 2 件", amount: 2 },
  { label: "加入 3 件", amount: 3 },
  { label: "移除 1 件", amount: -1 },
  { label: "加入 4 件", amount: 4 },
];

export class ScanDemoModel {
  private readonly stateSubject = new BehaviorSubject<ScanDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "cartAction$ 每 1000ms 发出一个变更；scan 把上一次状态和当前变更规约成新状态",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...ACTIONS.map((action) => of(action).pipe(delay(1000)))).pipe(
      tap((action) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { ...action, at: stamp() }],
          status: `cartAction$ 发出“${action.label}”，scan 会用它更新内部累计状态`,
        });
      }),
    );

    const result$ = source$.pipe(
      scan(
        (state, action) => ({
          total: state.total + action.amount,
          count: state.count + 1,
          label: action.label,
        }),
        INITIAL_CART,
      ),
    );

    this.subscription = result$.subscribe({
      next: (snapshot) => {
        this.patchState({
          snapshots: [...this.state.snapshots, { ...snapshot, at: stamp() }],
          status: `scan 输出状态：total=${snapshot.total}，这是第 ${snapshot.count} 次累计`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "scan 完成：每个上游 next 都产生了一个新的累计状态",
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

  private patchState(patch: Partial<ScanDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
