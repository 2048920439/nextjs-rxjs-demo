"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { WindowDemoModel } from "./window-demo.model";

// sidebar-title: 8.3.5 window：由 notifier$ 切分 Observable 窗口

const BOOK_CODE = `// 8.3.5 window
import { take, timer, window } from "rxjs";

const source$ = timer(0, 1000).pipe(take(8));
const notifier$ = timer(4000, 4000);
const result$ = source$.pipe(window(notifier$));

// notifier$ 每次发值，都会关闭前一个窗口并开启后一个窗口`;

const COMPLETE_CODE = `// 如果 notifier$ 发出一个值后立刻完结
const notifier$ = timer(4000);
const result$ = source$.pipe(window(notifier$));

// 第二个内部 Observable 会很快完结，result$ 也会完结`;

export default function WindowPage() {
  const [demo] = useState(() => new WindowDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.5 window：由 notifier$ 切分 Observable 窗口"
      subtitle="window 只接受一个 notifier$。notifier$ 每次发值，既是上一个内部 Observable 的结束，也是下一个内部 Observable 的开始。"
      sourceMeta="0 到 7，每 1000ms 发出一个"
      resultTitle="window$"
      resultMeta="每个结果项代表被 notifier$ 切开的内部 Observable"
      state={state}
      description={
        <>
          <li>
            <strong>单一边界流</strong>：notifier$ 同时负责关闭旧窗口和开启新窗口。
          </li>
          <li>
            <strong>规则最直接</strong>：相比 toggle/when，window 的参数更少。
          </li>
          <li>
            <strong>notifier 完结会影响结果</strong>：notifier$ 完结时，window 也会结束。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "notifier$ 完结的情况", code: COMPLETE_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
