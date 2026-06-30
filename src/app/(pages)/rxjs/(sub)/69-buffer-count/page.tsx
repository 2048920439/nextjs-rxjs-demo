"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { BufferCountDemoModel } from "./buffer-count-demo.model";

// sidebar-title: 8.3.2 bufferCount：按数量缓存为数组

const BOOK_CODE = `// 8.3.2 bufferCount
import { bufferCount, take, timer } from "rxjs";

const source$ = timer(0, 1000).pipe(take(10));
const result$ = source$.pipe(bufferCount(4));

result$.subscribe(console.log);

// [0, 1, 2, 3]
// [4, 5, 6, 7]
// [8, 9]`;

const START_EVERY_CODE = `// 第二个参数控制新 buffer 开始间隔
source$.pipe(bufferCount(4, 5));`;

export default function BufferCountPage() {
  const [demo] = useState(() => new BufferCountDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.2 bufferCount：按数量缓存为数组"
      subtitle="bufferCount 和 windowCount 一样按数量切分，只是下游收到的是数组。它适合批量处理固定数量的上游数据。"
      sourceMeta="0 到 9，每 1000ms 发出一个"
      resultTitle="bufferCount$"
      resultMeta="每个结果项是一个数组"
      state={state}
      description={
        <>
          <li>
            <strong>固定批量</strong>：每满 4 个值就输出一个数组。
          </li>
          <li>
            <strong>尾部保留</strong>：source$ 完结时，不足 4 个值也会输出。
          </li>
          <li>
            <strong>和 windowCount 对应</strong>：区别只在下游收到数组还是内部 Observable。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "开始间隔参数", code: START_EVERY_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
