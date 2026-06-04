import { memo } from "react";

import styles from "./styles.module.scss";

interface ControlButtonsProps {
  onDecrement: () => void;
  onIncrement: () => void;
  onReset: () => void;
}

/**
 * 控制按钮组 — React.memo 确保只要回调引用不变就跳过渲染
 * 父级通过 useCallback 传入稳定引用
 */
export const ControlButtons = memo(function ControlButtons({ onDecrement, onIncrement, onReset }: ControlButtonsProps) {
  return (
    <div className={styles.actions}>
      <button className={styles.btnMinus} onClick={onDecrement}>
        −
      </button>
      <button className={styles.btnReset} onClick={onReset}>
        ↺
      </button>
      <button className={styles.btnPlus} onClick={onIncrement}>
        +
      </button>
    </div>
  );
});
