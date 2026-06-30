"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { BufferDemoModel } from "./buffer-demo.model";

// sidebar-title: 8.3.5 buffer：由 notifier$ 输出缓存数组

const BOOK_CODE = `// 8.3.5 buffer
import { buffer, take, timer } from "rxjs";

const source$ = timer(0, 1000).pipe(take(8));
const notifier$ = timer(4000, 4000);
const result$ = source$.pipe(buffer(notifier$));

result$.subscribe(console.log);`;

const RELATION_CODE = `// buffer 和 window 的边界规则一致
source$.pipe(window(notifier$)); // 输出内部 Observable
source$.pipe(buffer(notifier$)); // 输出数组`;

export default function BufferPage() {
  const [demo] = useState(() => new BufferDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.5 buffer：由 notifier$ 输出缓存数组"
      subtitle="buffer 使用 notifier$ 切分缓存区。notifier$ 每次发值，当前缓存数组就被推给下游，然后开始下一轮缓存。"
      sourceMeta="0 到 7，每 1000ms 发出一个"
      resultTitle="buffer$"
      resultMeta="每个结果项是 notifier$ 触发时输出的数组"
      state={state}
      description={
        <>
          <li>
            <strong>单一边界流</strong>：notifier$ 决定何时输出数组。
          </li>
          <li>
            <strong>数组形式</strong>：下游不需要处理高阶 Observable。
          </li>
          <li>
            <strong>和 window 对应</strong>：边界相同，集合形式不同。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "和 window 的对应关系", code: RELATION_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
