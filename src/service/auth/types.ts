import type { Observable } from "rxjs";

import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

/** 登录状态枚举 */
export enum LoginStatus {
  Loading = 0,
  LoggedOut = 1,
  LoggedIn = 2,
}

/** Effect 统一上下文 —— 只暴露 Observable + 行动，不暴露 Subject */
export interface AuthEffectCtx {
  login$: Observable<LoginInput>;
  register$: Observable<RegisterInput>;
  logout$: Observable<void>;
  setUser(user: User | null, status: LoginStatus): void;
  setStatus(status: LoginStatus): void;
  pushError(msg: string): void;
  clearError(): void;
}
