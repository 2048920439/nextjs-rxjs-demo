"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { BufferTimeDemoModel } from "./buffer-time-demo.model";

// sidebar-title: 8.3.1 bufferTime：按时间缓存为数组

const BOOK_CODE = `// 8.3.1 bufferTime
import { bufferTime, take, timer } from "rxjs";

const source$ = timer(0, 1000).pipe(take(8));
const result$ = source$.pipe(bufferTime(4000));

result$.subscribe(console.log);

// 大致输出：[0, 1, 2, 3]、[4, 5, 6, 7]`;

const ADVANCED_CODE = `// 第三个参数限制每个时间段最多缓存多少值
source$.pipe(bufferTime(4000, 2000, 2));`;

export default function BufferTimePage() {
  const [demo] = useState(() => new BufferTimeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.1 bufferTime：按时间缓存为数组"
      subtitle="bufferTime 和 windowTime 的切分规则相同，但它把每段时间里的值缓存成数组，等窗口结束后再一次性推给下游。"
      sourceMeta="timer(0, 1000).pipe(take(8))"
      resultTitle="bufferTime$"
      resultMeta="每个结果项是一个数组"
      state={state}
      description={
        <>
          <li>
            <strong>数组输出</strong>：下游直接收到缓存数组。
          </li>
          <li>
            <strong>输出有延迟</strong>：必须等当前时间段结束后才输出。
          </li>
          <li>
            <strong>注意容量</strong>：高频上游可能让数组很大，可用第三个参数限制上限。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "限制缓存数量", code: ADVANCED_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
