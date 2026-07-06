import { BehaviorSubject, concat, delay, map, merge, of, partition, share, type Subscription, tap } from "rxjs";

export type PartitionKey = "even" | "odd";

export type PartitionSourceValue = {
  value: number;
  key: PartitionKey;
  at: string;
};

export type PartitionBucket = {
  key: PartitionKey;
  label: string;
  values: number[];
};

export type PartitionOutput = {
  key: PartitionKey;
  value: number;
  at: string;
};

export type PartitionDemoState = {
  running: boolean;
  status: string;
  sourceValues: PartitionSourceValue[];
  buckets: PartitionBucket[];
  outputs: PartitionOutput[];
};

const INITIAL_BUCKETS: PartitionBucket[] = [
  { key: "even", label: "even$", values: [] },
  { key: "odd", label: "odd$", values: [] },
];

const INITIAL_STATE: PartitionDemoState = {
  running: false,
  status: "点击运行，观察 partition 如何把一个流拆成两个 Observable",
  sourceValues: [],
  buckets: INITIAL_BUCKETS,
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5];

function getPartitionKey(value: number): PartitionKey {
  return value % 2 === 0 ? "even" : "odd";
}

export class PartitionDemoModel {
  private readonly stateSubject = new BehaviorSubject<PartitionDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      buckets: INITIAL_BUCKETS.map((bucket) => ({ ...bucket, values: [] })),
      running: true,
      status: "source$ 每 1000ms 发出一个数字；partition 把偶数和奇数送入两个结果流",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        const key = getPartitionKey(value);

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, key, at: stamp() }],
          status: `source$ 发出 ${value}，predicate 返回 ${key === "even" ? "true" : "false"}`,
        });
      }),
      share(),
    );

    const [even$, odd$] = partition(source$, (value) => value % 2 === 0);
    const result$ = merge(even$.pipe(map((value) => ({ key: "even" as const, value }))), odd$.pipe(map((value) => ({ key: "odd" as const, value }))));

    this.subscription = result$.subscribe({
      next: (item) => {
        this.patchState({
          buckets: this.state.buckets.map((bucket) => (bucket.key === item.key ? { ...bucket, values: [...bucket.values, item.value] } : bucket)),
          outputs: [...this.state.outputs, { ...item, at: stamp() }],
          status: `${item.value} 进入 ${item.key === "even" ? "even$" : "odd$"}；两个结果流可以分别订阅`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "partition 完成：满足条件的值进入 even$，其余值进入 odd$",
        });
      },
    });
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.stateSubject.next({
      ...INITIAL_STATE,
      buckets: INITIAL_BUCKETS.map((bucket) => ({ ...bucket, values: [] })),
    });
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private patchState(patch: Partial<PartitionDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
