import { BehaviorSubject } from "rxjs";

import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from "@/api-client/auth";
import { BaseService } from "@/service-core";
import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

/** UI 层用户状态：undefined=加载中, null=未登录, User=已登录 */
export type AuthState = User | null | undefined;

export class AuthService extends BaseService {
  private _user$ = new BehaviorSubject<AuthState>(this.initState);
  readonly user$ = this._user$.asObservable();
  get user(): AuthState {
    return this._user$.value;
  }

  constructor(private initState: AuthState | null) {
    super();
  }

  /** 初始化 / 刷新用户状态 */
  async fetchUser(): Promise<void> {
    try {
      const user = await getMe();
      this._user$.next(user);
    } catch {
      this._user$.next(null);
    }
  }

  async login(data: LoginInput): Promise<User> {
    const user = await loginApi(data);
    this._user$.next(user);
    return user;
  }

  async register(data: RegisterInput): Promise<User> {
    const user = await registerApi(data);
    this._user$.next(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await logoutApi();
    } finally {
      this._user$.next(null);
    }
  }
}
