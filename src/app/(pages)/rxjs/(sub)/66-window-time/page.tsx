"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { WindowTimeDemoModel } from "./window-time-demo.model";

// sidebar-title: 8.3.1 windowTime：按时间切出 Observable 窗口

const BOOK_CODE = `// 8.3.1 windowTime
import { take, timer, windowTime } from "rxjs";

const source$ = timer(0, 1000).pipe(take(8));
const result$ = source$.pipe(windowTime(4000));

// result$ 是高阶 Observable：
// 每 4000ms 输出一个内部 Observable`;

const ADVANCED_CODE = `// 第二个参数控制新窗口开启间隔，第三个参数限制每个窗口最多接收多少值
source$.pipe(windowTime(4000, 2000, 2));`;

export default function WindowTimePage() {
  const [demo] = useState(() => new WindowTimeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.1 windowTime：按时间切出 Observable 窗口"
      subtitle="windowTime 按固定时间长度切分上游，把每段时间内的值放进一个内部 Observable，再把这些内部 Observable 交给下游。"
      sourceMeta="timer(0, 1000).pipe(take(8))"
      resultTitle="windowTime$"
      resultMeta="每个结果项代表一个内部 Observable 完结后的内容"
      state={state}
      description={
        <>
          <li>
            <strong>高阶输出</strong>：下游收到的是 Observable，而不是数组。
          </li>
          <li>
            <strong>按时间分段</strong>：这里每 4000ms 形成一个窗口。
          </li>
          <li>
            <strong>不主动丢值</strong>：每个 source$ 值都会进入当时打开的窗口。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "重叠窗口和最大窗口容量", code: ADVANCED_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
