"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { BufferWhenDemoModel } from "./buffer-when-demo.model";

// sidebar-title: 8.3.3 bufferWhen：由 closingSelector 输出数组

const BOOK_CODE = `// 8.3.3 bufferWhen
import { bufferWhen, take, timer } from "rxjs";

const source$ = timer(0, 1000).pipe(take(8));
const closingSelector = () => timer(4000);
const result$ = source$.pipe(bufferWhen(closingSelector));

result$.subscribe(console.log);`;

const RELATION_CODE = `// bufferWhen 和 windowWhen 的边界规则一致
source$.pipe(windowWhen(() => timer(4000))); // 输出内部 Observable
source$.pipe(bufferWhen(() => timer(4000))); // 输出数组`;

export default function BufferWhenPage() {
  const [demo] = useState(() => new BufferWhenDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.3 bufferWhen：由 closingSelector 输出数组"
      subtitle="bufferWhen 和 windowWhen 使用同样的关闭通知，但它把窗口内的值缓存成数组，在关闭时一次性输出。"
      sourceMeta="0 到 7，每 1000ms 发出一个"
      resultTitle="bufferWhen$"
      resultMeta="每个结果项是一个数组"
      state={state}
      description={
        <>
          <li>
            <strong>通知流控制边界</strong>：closingSelector 返回的 Observable 决定何时输出。
          </li>
          <li>
            <strong>数组输出</strong>：不需要再订阅内部 Observable。
          </li>
          <li>
            <strong>缓存有成本</strong>：窗口越长，上游越密，数组越大。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "和 windowWhen 的对应关系", code: RELATION_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
