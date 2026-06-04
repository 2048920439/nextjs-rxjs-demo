import { memo } from "react";

import { useObservableState, useService } from "@/service-core";

import { NumberOrchestrationService } from "../../_service/number-orchestration.service";
import { ValueCard } from "./value-card";

/**
 * 派生流卡片 — 独立订阅 square$，不受 number$ 变更速率的直接影响（React.memo 屏障）
 */
export const DerivedCard = memo(function DerivedCard() {
  const svc = useService(NumberOrchestrationService);
  const square = useObservableState(svc.square$, () => svc.square);

  return <ValueCard label="Derived" streamName="square$" value={square} />;
});
