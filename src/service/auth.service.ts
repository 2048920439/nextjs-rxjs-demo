import { BehaviorSubject } from "rxjs";

import { getMe, logout as logoutApi } from "@/api-client/auth";
import { type AuthActionState, loginAction, registerAction } from "@/lib/auth-actions";
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
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);

    const initialState: AuthActionState = { error: "", success: false };
    const result = await loginAction(initialState, formData);
    if (!result.success) throw new Error(result.error);

    await this._fetchUser();
  }

  async register(data: RegisterInput): Promise<void> {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("name", data.name);

    const initialState: AuthActionState = { error: "", success: false };
    const result = await registerAction(initialState, formData);
    if (!result.success) throw new Error(result.error);

    await this._fetchUser();
  }

  logout(): Promise<void> {
    this._user$.next(null);
    return logoutApi();
  }
}
