"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { WindowWhenDemoModel } from "./window-when-demo.model";

// sidebar-title: 8.3.3 windowWhen：由 closingSelector 关闭窗口

const BOOK_CODE = `// 8.3.3 windowWhen
import { take, timer, windowWhen } from "rxjs";

const source$ = timer(0, 1000).pipe(take(8));
const closingSelector = () => timer(4000);
const result$ = source$.pipe(windowWhen(closingSelector));

// closingSelector 返回的 Observable 发值时，
// 当前内部 Observable 完结，并开启下一个窗口`;

const CLICK_CODE = `// closingSelector 也可以返回外部事件流
import { fromEvent, windowWhen } from "rxjs";

const closingSelector = () => fromEvent(document.querySelector("#click")!, "click");
const result$ = source$.pipe(windowWhen(closingSelector));`;

export default function WindowWhenPage() {
  const [demo] = useState(() => new WindowWhenDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.3 windowWhen：由 closingSelector 关闭窗口"
      subtitle="windowWhen 用一个无参数的 closingSelector 为每个窗口创建关闭通知。关闭通知发值或完结时，当前内部 Observable 完结并开启新窗口。"
      sourceMeta="0 到 7，每 1000ms 发出一个"
      resultTitle="windowWhen$"
      resultMeta="每个结果项代表一个内部 Observable"
      state={state}
      description={
        <>
          <li>
            <strong>通知流控制关闭</strong>：窗口边界由 closingSelector 返回的 Observable 决定。
          </li>
          <li>
            <strong>selector 没有参数</strong>：它不能直接知道当前上游值。
          </li>
          <li>
            <strong>仍输出内部 Observable</strong>：下游要自行订阅或摊平这些窗口。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "用外部事件关闭窗口", code: CLICK_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
