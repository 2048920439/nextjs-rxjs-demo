import { BehaviorSubject } from "rxjs";

import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from "@/api-client";
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
  private async _fetchUser(): Promise<void> {
    try {
      const user = await getMe();
      this._user$.next(user);
    } catch {
      this._user$.next(null);
    }
  }

  async login(data: LoginInput): Promise<void> {
    await loginApi(data);
    await this._fetchUser();
  }

  async register(data: RegisterInput): Promise<void> {
    await registerApi(data);
    await loginApi({ email: data.email, password: data.password });
    await this._fetchUser();
  }

  logout(): Promise<void> {
    this._user$.next(null);
    return logoutApi();
  }
}
