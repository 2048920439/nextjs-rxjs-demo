import { memo } from "react";

import { useObservableState, useService } from "@/service-core";

import { NumberOrchestrationService } from "../../_service/number-orchestration.service";
import { ValueCard } from "./value-card";

/**
 * 源流卡片 — 独立订阅 number$，React.memo 防止父级无关更新导致重渲染
 */
export const SourceCard = memo(function SourceCard() {
  const svc = useService(NumberOrchestrationService);
  const number = useObservableState(svc.number$, () => svc.number);

  return <ValueCard label="Source" streamName="number$" value={number} negative={number < 0} />;
});
