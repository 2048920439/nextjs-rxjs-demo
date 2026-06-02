import { CounterControl } from "./components/counter-control";
import { CounterDisplay } from "./components/counter-display";
import { Provider } from "./components/provoder";
import styles from "./page.module.scss";

export default function ServicePage() {
  return (
    <Provider>
      <div className={styles.page}>
        <h2 className="mb-6 text-center text-2xl font-bold">🔧 Service Demo — 跨组件通信</h2>
        <p className="mb-6 text-center text-gray-500">CounterService 在 Provider factory 中注册，两个组件通过 useService 获取同一实例</p>
        <div className="grid grid-cols-2 gap-4">
          <CounterDisplay />
          <CounterControl />
        </div>
      </div>
    </Provider>
  );
}
