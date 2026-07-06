import { BehaviorSubject, concat, delay, groupBy, map, mergeMap, of, type Subscription, tap } from "rxjs";

export type GroupByKey = "even" | "odd";

export type GroupBySourceValue = {
  value: number;
  key: GroupByKey;
  at: string;
};

export type GroupByBucket = {
  key: GroupByKey;
  label: string;
  values: number[];
  openedAt: string;
};

export type GroupByOutput = {
  key: GroupByKey;
  value: number;
  at: string;
};

export type GroupByDemoState = {
  running: boolean;
  status: string;
  sourceValues: GroupBySourceValue[];
  groups: GroupByBucket[];
  outputs: GroupByOutput[];
};

const INITIAL_STATE: GroupByDemoState = {
  running: false,
  status: "点击运行，观察 groupBy 如何按 key 拆出多个内部 Observable",
  sourceValues: [],
  groups: [],
  outputs: [],
};

const VALUES = [0, 1, 2, 3, 4, 5];

function getGroupKey(value: number): GroupByKey {
  return value % 2 === 0 ? "even" : "odd";
}

function getGroupLabel(key: GroupByKey) {
  return key === "even" ? "even$" : "odd$";
}

export class GroupByDemoModel {
  private readonly stateSubject = new BehaviorSubject<GroupByDemoState>(INITIAL_STATE);
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
      status: "source$ 每 1000ms 发出一个数字；groupBy 根据奇偶 key 分发给不同分组",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        const key = getGroupKey(value);

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, key, at: stamp() }],
          status: `source$ 发出 ${value}，keySelector 返回 ${key}`,
        });
      }),
    );

    const result$ = source$.pipe(
      groupBy((value): GroupByKey => getGroupKey(value)),
      mergeMap((group$) => {
        const key = group$.key;

        if (!this.state.groups.some((group) => group.key === key)) {
          this.patchState({
            groups: [...this.state.groups, { key, label: getGroupLabel(key), values: [], openedAt: stamp() }],
            status: `groupBy 第一次看到 key=${key}，创建 ${getGroupLabel(key)}`,
          });
        }

        return group$.pipe(
          map((value) => ({
            key,
            value,
          })),
        );
      }),
    );

    this.subscription = result$.subscribe({
      next: (item) => {
        this.patchState({
          groups: this.state.groups.map((group) => (group.key === item.key ? { ...group, values: [...group.values, item.value] } : group)),
          outputs: [...this.state.outputs, { ...item, at: stamp() }],
          status: `${item.value} 被送入 ${getGroupLabel(item.key)}；同一个 key 的后续值会复用这个分组`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "groupBy 完成：上游被拆成 even$ 和 odd$ 两个分组流",
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

  private patchState(patch: Partial<GroupByDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
