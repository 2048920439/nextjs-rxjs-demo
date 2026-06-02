# Next.js + RxJS 学习项目

本项目是一个基于 [Next.js](https://nextjs.org) 和 [RxJS](https://rxjs.dev) 的前端学习项目，用于探索和实践 **响应式编程** 在 React 应用中的应用模式。

## 技术栈

- **Next.js 16** — React 全栈框架
- **RxJS 7** — 响应式编程库
- **React 19** — UI 框架
- **TypeScript** — 类型安全
- **SCSS Module** — 样式方案
- **Tailwind CSS** — 原子化 CSS 辅助

## 项目特色

### Service-Core 服务层

项目实现了一个基于 RxJS 的轻量级服务层框架，核心特性：

- **`BaseService`** — 服务基类，提供生命周期管理（hydrate / mount / unmount）
- **`PersistSubject`** — 支持自动持久化到 `localStorage` 的 `BehaviorSubject`
- **`ServiceRegistry`** — 服务注册中心，管理服务实例的创建与生命周期
- **`useService`** — React Hook，在组件中获取服务实例
- **`useObservable`** — React Hook，订阅 RxJS Observable 并自动更新组件

### 示例：CounterService

```ts
export class CounterService extends BaseService {
  private readonly _count$ = new BehaviorSubject<number>(0);

  get count$() { return this._count$.asObservable(); }
  get count(): number { return this._count$.value; }

  increment(): void { this._count$.next(this._count$.value + 1); }
  decrement(): void { this._count$.next(this._count$.value - 1); }
  reset(): void { this._count$.next(0); }
}
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 脚本命令

| 命令              | 说明                 |
| ----------------- | -------------------- |
| `pnpm dev`        | 启动开发服务器       |
| `pnpm build`      | 构建生产版本         |
| `pnpm start`      | 启动生产服务器       |
| `pnpm lint`       | 代码检查             |
| `pnpm lint:fix`   | 自动修复代码问题     |
| `pnpm format`     | 格式化代码           |
| `pnpm format:check` | 检查代码格式       |

## 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [RxJS 官方文档](https://rxjs.dev/guide/overview)
- [Learn RxJS](https://www.learnrxjs.io/)
