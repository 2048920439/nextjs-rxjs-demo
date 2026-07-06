import { BehaviorSubject, concat, delay, map, mergeScan, of, type Subscription, tap } from "rxjs";

export type TweetItem = {
  id: string;
  text: string;
};

export type MergeScanTrigger = {
  request: number;
  cursor: string;
  at: string;
};

export type MergeScanBatch = {
  request: number;
  cursor: string;
  newItems: TweetItem[];
  total: number;
  at: string;
};

export type MergeScanDemoState = {
  running: boolean;
  status: string;
  triggers: MergeScanTrigger[];
  batches: MergeScanBatch[];
  items: TweetItem[];
};

type FeedState = {
  request: number;
  cursor: string;
  items: TweetItem[];
  newItems: TweetItem[];
};

const INITIAL_FEED: FeedState = {
  request: 0,
  cursor: "start",
  items: [],
  newItems: [],
};

const INITIAL_STATE: MergeScanDemoState = {
  running: false,
  status: "点击运行，观察 mergeScan 如何把异步请求结果累计回同一个列表",
  triggers: [],
  batches: [],
  items: [],
};

const PAGES: Record<number, TweetItem[]> = {
  0: [
    { id: "t01", text: "第一屏内容" },
    { id: "t02", text: "继续向下阅读" },
  ],
  1: [
    { id: "t03", text: "第二页新增内容" },
    { id: "t04", text: "列表继续扩展" },
  ],
  2: [
    { id: "t05", text: "第三页加载完成" },
    { id: "t06", text: "累计列表保持完整" },
  ],
};

const LOAD_MORE_EVENTS = [1, 2, 3];

function getLastId(items: TweetItem[]) {
  return items.length === 0 ? "start" : items[items.length - 1].id;
}

function getPageIndexByCursor(cursor: string) {
  if (cursor === "start") return 0;
  const numericPart = Number(cursor.replace("t", ""));
  return Math.floor(numericPart / 2);
}

function getTweets$(cursor: string) {
  return of(PAGES[getPageIndexByCursor(cursor)] ?? []).pipe(delay(900));
}

export class MergeScanDemoModel {
  private readonly stateSubject = new BehaviorSubject<MergeScanDemoState>(INITIAL_STATE);
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
      status: "scrollToEnd$ 触发加载更多；mergeScan 用当前累计列表决定下一次请求",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...LOAD_MORE_EVENTS.map((request) => of(request).pipe(delay(1400))));

    const result$ = source$.pipe(
      mergeScan(
        (feed, request) => {
          const cursor = getLastId(feed.items);

          return getTweets$(cursor).pipe(
            tap({
              subscribe: () => {
                this.patchState({
                  triggers: [...this.state.triggers, { request, cursor, at: stamp() }],
                  status: `scrollToEnd$ 触发第 ${request} 次加载，mergeScan 用累计列表算出 cursor=${cursor}`,
                });
              },
            }),
            map((newItems) => ({
              request,
              cursor,
              newItems,
              items: [...feed.items, ...newItems],
            })),
          );
        },
        INITIAL_FEED,
        1,
      ),
    );

    this.subscription = result$.subscribe({
      next: (feed) => {
        this.patchState({
          items: feed.items,
          batches: [
            ...this.state.batches,
            {
              request: feed.request,
              cursor: feed.cursor,
              newItems: feed.newItems,
              total: feed.items.length,
              at: stamp(),
            },
          ],
          status: `第 ${feed.request} 次请求返回 ${feed.newItems.length} 条，mergeScan 输出累计列表 ${feed.items.length} 条`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "mergeScan 完成：每次异步返回都合并进同一个累计列表",
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

  private patchState(patch: Partial<MergeScanDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
