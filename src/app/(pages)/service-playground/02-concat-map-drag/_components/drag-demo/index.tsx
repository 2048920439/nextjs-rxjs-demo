"use client";

import { useEffect, useRef } from "react";

import { useObservableState, useService } from "@/service-core";

import { ConcatMapDragService } from "../../_service/concat-map-drag.service";
import styles from "./styles.module.scss";

export default function DragDemo() {
  const service = useService(ConcatMapDragService);
  const state = useObservableState(service.state$, () => service.state);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const box = boxRef.current;
    if (!stage || !box) return;

    service.connect(stage, box);

    return () => service.disconnect();
  }, [service]);

  return (
    <section className={styles.demo}>
      <div className={styles.header}>
        <p>{state.status}</p>
        <button onClick={() => service.reset()}>重置位置</button>
      </div>

      <div ref={stageRef} className={styles.stage}>
        <div
          ref={boxRef}
          className={styles.box}
          data-dragging={state.dragging}
          style={{
            transform: `translate(${state.left}px, ${state.top}px)`,
          }}
        >
          drag
        </div>
      </div>

      <div className={styles.metrics}>
        <article>
          <span>drag count</span>
          <strong>{state.dragCount}</strong>
        </article>
        <article>
          <span>move count</span>
          <strong>{state.moveCount}</strong>
        </article>
        <article>
          <span>last point</span>
          <strong>{state.lastPoint ? `${Math.round(state.lastPoint.x)}, ${Math.round(state.lastPoint.y)}` : "-"}</strong>
        </article>
      </div>
    </section>
  );
}
