import { clsx } from "clsx";
import { memo } from "react";

import styles from "./styles.module.scss";

interface ValueCardProps {
  label: string;
  streamName: string;
  value: number;
  negative?: boolean;
}

/**
 * 纯展示卡片 — React.memo 保证 props 不变时跳过渲染
 */
export const ValueCard = memo(function ValueCard({ label, streamName, value, negative = false }: ValueCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.cardLabel}>
        {label}
        <br />
        <code>{streamName}</code>
      </span>
      <span className={clsx(styles.cardValue, negative && styles.cardValueNegative)}>{value}</span>
    </div>
  );
});
