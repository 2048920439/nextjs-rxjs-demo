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

/** Effect 上下文 —— 命令流 + 原子操作，Effect 层组合调用 */
export interface AuthEffectCtx {
  login$: Observable<LoginInput>;
  register$: Observable<RegisterInput>;
  logout$: Observable<void>;
  /** 原子操作 —— 各司其职 */
  pushUser(user: User | null): void;
  pushUserState(status: LoginStatus): void;
  pushLoginState(result: AuthResult): void;
  pushRegisterState(result: AuthResult): void;
  pushLogoutState(result: AuthResult): void;
}
