"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { WindowCountDemoModel } from "./window-count-demo.model";

// sidebar-title: 8.3.2 windowCount：按数量切出 Observable 窗口

const BOOK_CODE = `// 8.3.2 windowCount
import { take, timer, windowCount } from "rxjs";

const source$ = timer(0, 1000).pipe(take(10));
const result$ = source$.pipe(windowCount(4));

// 每 4 个值产生一个内部 Observable`;

const START_EVERY_CODE = `// 第二个参数 startWindowEvery 控制新窗口开启间隔
source$.pipe(windowCount(4, 5));

// 间隔大于窗口长度时，中间的值可能没有窗口接收`;

export default function WindowCountPage() {
  const [demo] = useState(() => new WindowCountDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.2 windowCount：按数量切出 Observable 窗口"
      subtitle="windowCount 不看时间，只按上游 next 的个数切分窗口。达到指定数量后，当前内部 Observable 完结。"
      sourceMeta="0 到 9，每 1000ms 发出一个"
      resultTitle="windowCount$"
      resultMeta="每个结果项代表一个内部 Observable 完结后的内容"
      state={state}
      description={
        <>
          <li>
            <strong>按个数分段</strong>：这里每 4 个值形成一个窗口。
          </li>
          <li>
            <strong>仍是高阶输出</strong>：结果是 Observable 的 Observable。
          </li>
          <li>
            <strong>可控制开启间隔</strong>：第二个参数会改变窗口重叠或跳过行为。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "startWindowEvery 参数", code: START_EVERY_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
