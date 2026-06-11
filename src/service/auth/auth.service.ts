import { BehaviorSubject, filter, map, Subject } from "rxjs";

import { BaseService } from "@/service-core";
import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

import { loginEffect, logoutEffect, registerEffect } from "./effects";
import type { AuthEffectCtx, AuthResult } from "./types";
import { LoginStatus } from "./types";

export class AuthService extends BaseService {
  // 状态
  private _user$ = new BehaviorSubject<User | null>(this.initUser);
  readonly user$ = this._user$.asObservable();
  get user(): User | null {
    return this._user$.value;
  }

  private _userState$ = new BehaviorSubject<LoginStatus>(this.initUser ? LoginStatus.LoggedIn : LoginStatus.LoggedOut);
  readonly userState$ = this._userState$.asObservable();
  get userState(): LoginStatus {
    return this._userState$.value;
  }

  // 命令
  private _loginEvent$ = new Subject<LoginInput>();
  readonly login = (data: LoginInput) => this._loginEvent$.next(data);

  private _registerEvent$ = new Subject<RegisterInput>();
  readonly register = (data: RegisterInput) => this._registerEvent$.next(data);

  private _logoutEvent$ = new Subject<void>();
  readonly logout = () => this._logoutEvent$.next();

  // 事件流（输出）
  private _loginResult$ = new Subject<AuthResult>();
  readonly loginSuccess$ = this._loginResult$.pipe(
    filter((r) => r.state === "success"),
    map(() => undefined),
  );
  readonly loginFailed$ = this._loginResult$.pipe(
    filter((r) => r.state === "failed"),
    map((r) => r.msg),
  );

  private _registerResult$ = new Subject<AuthResult>();
  readonly registerSuccess$ = this._registerResult$.pipe(
    filter((r) => r.state === "success"),
    map(() => undefined),
  );
  readonly registerFailed$ = this._registerResult$.pipe(
    filter((r) => r.state === "failed"),
    map((r) => r.msg),
  );

  private _logoutResult$ = new Subject<AuthResult>();
  readonly logoutSuccess$ = this._logoutResult$.pipe(
    filter((r) => r.state === "success"),
    map(() => undefined),
  );
  readonly logoutFailed$ = this._logoutResult$.pipe(
    filter((r) => r.state === "failed"),
    map((r) => r.msg),
  );

  constructor(private initUser: User | null = null) {
    super();

    const ctx: AuthEffectCtx = {
      login$: this._loginEvent$,
      register$: this._registerEvent$,
      logout$: this._logoutEvent$,
      pushUser: (user) => this._user$.next(user),
      pushUserState: (status) => this._userState$.next(status),
      pushLoginState: (result) => this._loginResult$.next(result),
      pushRegisterState: (result) => this._registerResult$.next(result),
      pushLogoutState: (result) => this._logoutResult$.next(result),
    };

    this.registerEffects(ctx, [loginEffect, registerEffect, logoutEffect]);
  }
}
