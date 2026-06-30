"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { BufferToggleDemoModel } from "./buffer-toggle-demo.model";

// sidebar-title: 8.3.4 bufferToggle：由 openings$ 控制数组缓存

const BOOK_CODE = `// 8.3.4 bufferToggle
import { bufferToggle, take, timer } from "rxjs";

const source$ = timer(0, 1000).pipe(take(9));
const openings$ = timer(0, 4000).pipe(take(3));
const closingSelector = (value: number) => {
  return value % 2 === 0 ? timer(2000) : timer(1000);
};

const result$ = source$.pipe(bufferToggle(openings$, closingSelector));
result$.subscribe(console.log);`;

const RELATION_CODE = `// bufferToggle 和 windowToggle 的边界规则一致
source$.pipe(windowToggle(openings$, closingSelector)); // 输出内部 Observable
source$.pipe(bufferToggle(openings$, closingSelector)); // 输出数组`;

export default function BufferTogglePage() {
  const [demo] = useState(() => new BufferToggleDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.4 bufferToggle：由 openings$ 控制数组缓存"
      subtitle="bufferToggle 和 windowToggle 使用同样的开关规则，但它把每个打开区间里的值收集成数组。"
      sourceMeta="0 到 8，每 1000ms 发出一个"
      resultTitle="bufferToggle$"
      resultMeta="每个结果项是一个打开区间里的数组"
      state={state}
      description={
        <>
          <li>
            <strong>opening 开始缓存</strong>：openings$ 每次发值都会新建一个 buffer。
          </li>
          <li>
            <strong>closingSelector 结束缓存</strong>：返回的 Observable 发值时输出数组。
          </li>
          <li>
            <strong>可重叠缓存</strong>：多个 buffer 同时打开时，同一个值会进入多个数组。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "和 windowToggle 的对应关系", code: RELATION_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
