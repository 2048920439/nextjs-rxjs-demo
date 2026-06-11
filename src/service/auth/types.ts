import type { Observable } from "rxjs";

import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

/** 登录状态枚举 */
export enum LoginStatus {
  Loading = 0,
  LoggedOut = 1,
  LoggedIn = 2,
}

/** 认证结果 */
export type AuthResult<T = unknown> = ({ state: "success" } & T) | { state: "failed"; msg: string };

/** Effect 上下文 —— 命令流 + 语义 Transition，Effect 层表达业务意图，Service 层协调多流 */
export interface AuthEffectCtx {
  login$: Observable<LoginInput>;
  register$: Observable<RegisterInput>;
  logout$: Observable<void>;
  /** 标记加载中（transition 前置信号） */
  setLoading(): void;
  /** 登录成功：写入用户、标记已登录、发射成功事件 */
  loginSuccess(user: User): void;
  /** 登录失败：标记未登录、发射失败事件 */
  loginFailed(msg: string): void;
  /** 注册成功：写入用户、标记已登录、发射成功事件 */
  registerSuccess(user: User): void;
  /** 注册失败：标记未登录、发射失败事件 */
  registerFailed(msg: string): void;
  /** 登出成功：清空用户、标记未登录、发射成功事件 */
  logoutSuccess(): void;
  /** 登出失败：发射失败事件 */
  logoutFailed(msg: string): void;
}
