"use client";

import { useCallback, useEffect, useState } from "react";

import { useObservableState } from "@/service-core";

import { WindowBufferDemoPage } from "../_window-buffer/window-buffer-demo";
import { WindowToggleDemoModel } from "./window-toggle-demo.model";

// sidebar-title: 8.3.4 windowToggle：由 openings$ 控制窗口开关

const BOOK_CODE = `// 8.3.4 windowToggle
import { take, timer, windowToggle } from "rxjs";

const source$ = timer(0, 1000).pipe(take(9));
const openings$ = timer(0, 4000).pipe(take(3));
const closingSelector = (value: number) => {
  return value % 2 === 0 ? timer(2000) : timer(1000);
};

const result$ = source$.pipe(windowToggle(openings$, closingSelector));`;

const OVERLAP_CODE = `// closingSelector 的持续时间超过 openings$ 间隔时，窗口会重叠
source$.pipe(windowToggle(openings$, () => timer(6000)));`;

export default function WindowTogglePage() {
  const [demo] = useState(() => new WindowToggleDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <WindowBufferDemoPage
      title="8.3.4 windowToggle：由 openings$ 控制窗口开关"
      subtitle="windowToggle 用 openings$ 决定何时开启窗口，再把 opening 值交给 closingSelector 决定这个窗口何时关闭。"
      sourceMeta="0 到 8，每 1000ms 发出一个"
      resultTitle="windowToggle$"
      resultMeta="每个结果项代表一个打开后又关闭的内部 Observable"
      state={state}
      description={
        <>
          <li>
            <strong>opening 决定开始</strong>：openings$ 每次发值都会新开一个窗口。
          </li>
          <li>
            <strong>closingSelector 有参数</strong>：它能根据 opening 值定制关闭时机。
          </li>
          <li>
            <strong>窗口可重叠</strong>：关闭时间长于开启间隔时，一个 source$ 值可进入多个窗口。
          </li>
        </>
      }
      codeBlocks={[
        { title: "原书示例的 RxJS 7 写法", code: BOOK_CODE },
        { title: "重叠窗口", code: OVERLAP_CODE },
      ]}
      onRun={run}
      onReset={reset}
    />
  );
}
