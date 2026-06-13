# Service-Core: 自研 DI 服务框架

> 基于 RxJS 的轻量级依赖注入框架，是项目最核心的基础设施。
> 源码: `src/service-core/`

---

## 核心模块一览

| 模块              | 文件                       | 职责                                                        |
| ----------------- | -------------------------- | ----------------------------------------------------------- |
| `BaseService`     | `core/base-service.ts`     | 服务基类：生命周期钩子 + Effects 注册 + PersistSubject 管理 |
| `ServiceRegistry` | `core/service-registry.ts` | DI 容器：注册 / 解析 / 父子链回溯                           |
| `InjectionToken`  | `core/create-token.ts`     | 类型安全的 Symbol Token                                     |
| `Effect`          | `core/effect.ts`           | Effect 类型定义 + `registerEffects()` 批量注册              |
| `PersistCache`    | `core/persist-cache.ts`    | localStorage 缓存：TTL 过期 / 数据校验 / NaCl 加密          |
| `PersistSubject`  | `core/persist-subject.ts`  | 自动持久化 BehaviorSubject（1s debounce）                   |

### React 绑定层

| 模块                      | 文件                                  | 职责                                     |
| ------------------------- | ------------------------------------- | ---------------------------------------- |
| `ServiceRegistryContext`  | `react/service-registry-context.ts`   | 统一 React Context                       |
| `ServiceRegistryProvider` | `react/service-registry-provider.tsx` | Provider：驱动 hydrate → mount → unmount |
| `useService`              | `react/use-service.ts`                | 从 DI 容器解析 Service                   |
| `useObservableState`      | `react/use-observable.ts`             | 订阅 Observable 驱动渲染（浅比较优化）   |
| `useObservable`           | `react/use-observable.ts`             | 订阅 Observable 触发副作用回调           |

---

## BaseService 生命周期

```
Provider 挂载
  → useIsomorphicLayoutEffect: s._hydrate()       // 从 localStorage 恢复 PersistSubject
      → PersistSubject.rehydrate() 逐个恢复
      → onHydrate 回调执行
  → useEffect: s._mount()                         // 注册的 Effects 已通过构造函数启动
      → onMount 回调执行
  → 组件卸载
      → s._unmount()
          → onUnmount 回调执行
          → 所有 Subscription.unsubscribe()
```

### 钩子注册

```typescript
class MyService extends BaseService {
  protected setup(hooks: LifecycleHooks): void {
    hooks.onMount(() => {
      /* 挂载后 */
    });
    hooks.onUnmount(() => {
      /* 卸载前 */
    });
    hooks.onHydrate(() => {
      /* 恢复持久化数据后 */
    });
  }
}
```

---

## ServiceRegistry: DI 容器

### 核心机制

- **register()**: 注册 token → 工厂函数。自动检查 parent 链：若 parent 已注册则跳过，保证单例由顶层持有
- **resolve()**: 解析 token。先查当前层，未命中则沿 parent 链回溯
- **has()**: 检查 token 是否存在（含 parent 链）
- **forEach()**: 仅遍历**本层**实例（避免父层服务生命周期被重复触发）

```typescript
// Provider 中注册
<ServiceRegistryProvider
  factory={(registry, parent) => {
    registry.register(AuthService, () => new AuthService(initUser));
  }}
/>

// 组件中使用
const auth = useService(AuthService);  // 自动沿链回溯
```

### 父子链嵌套

```
<ServiceRegistryProvider factory={...}>           // 根 registry (parent = null)
  <ServiceRegistryProvider factory={...}>         // 子 registry (parent = 根)
    {/* useService 先在子层查，再向父层回溯 */}
  </ServiceRegistryProvider>
</ServiceRegistryProvider>
```

---

## Effect 模式

### 设计原则

- Effects **不持有状态** — 通过抽象 ctx 接口读写
- Effects **不了解具体 Service** — 仅依赖抽象接口
- Effects 是**副作用编排器** — 映射命令到 API 调用再到状态转变

### 模式结构

```typescript
// 1. 定义抽象上下文（藏在 types.ts 中，不暴露 Service）
interface MyCtx {
  command$: Observable<Input>;
  onSuccess(data: Output): void;
  onError(msg: string): void;
}

// 2. 编写纯编排函数
const myEffect: Effect<MyCtx> = (ctx) =>
  ctx.command$.pipe(
    switchMap(data => from(callApi(data)).pipe(
      tap(result => ctx.onSuccess(result)),
      catchError(err => { ctx.onError(err.message); return EMPTY; })
    ))
  ).subscribe();

// 3. Service 构造函数中注入
constructor() {
  super();
  const ctx: MyCtx = {
    command$: this._command$,
    onSuccess: (data) => { this._state$.next(data); },
    onError: (msg) => { /* ... */ },
  };
  this.registerEffects(ctx, [myEffect]);
}
```

### AuthService 实例

- 命令流：`loginEvent$`, `registerEvent$`, `logoutEvent$` (Subject)
- 状态流：`user$`, `userState$` (BehaviorSubject)
- 结果流：`loginSuccess$`, `loginFailed$` 等 (Subject + filter/map)
- Effects：`loginEffect`, `registerEffect`, `logoutEffect`
- 详见 `src/service/auth/auth.service.ts` + `effects.ts` + `types.ts`

---

## PersistSubject: 自动持久化

```typescript
const score$ = this.createPersistSubject(0, {
  key: "game_score", // localStorage key (必填)
  ttl: 3600000, // 1小时过期 (可选, 0=永不过期)
  encrypt: true, // NaCl 对称加密 (可选)
  check: (v) => v >= 0, // 有效性校验 (可选)
});

score$.next(42); // 自动写入 localStorage (1s debounce)
score$.rehydrate(); // 从 localStorage 恢复
score$.clearStorage(); // 清除
```

内部通过 `PersistCache` 封装 localStorage 操作，支持：

- **TTL 过期**: 存储 `{ v: value, t: timestamp }`，读取时校验
- **数据校验**: `check` 回调返回 false 则丢弃
- **NaCl 加密**: `encrypt: true` 时用 secretbox 加密存储

---

## React 绑定

### useService

```typescript
// 通过类构造函数获取
const auth = useService(AuthService);
// 通过 InjectionToken 获取
const myService = useService(MY_TOKEN);
// 失败时抛出: [useService] No ServiceRegistryProvider found
```

### useObservableState

```typescript
const user = useObservableState(auth.user$, () => auth.user);
// 特点:
// 1. getter 仅在 observable 发射事件时被调用（非同步求值）
// 2. 内置 shallowEqual 比较（避免相同值触发重渲染）
// 3. 基于 useSyncExternalStore（React 18+ Concurrent 安全）
// 注意: getter 中依赖的外部状态变更不会触发更新，需用 useMemo 组合
```

### useObservable

```typescript
useObservable(auth.loginFailed$, (msg) => setError(msg));
// 特点: 使用 useLatest(callback) 保证回调始终是最新引用
```

### shallowEqual

`src/shared/utils/object.ts` — 对 `Map` / `Set` / `Date` 做特判，避免 `Object.keys` 遗漏内部状态导致误判相等。
