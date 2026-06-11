import { BehaviorSubject, filter, map, pairwise, Subject } from "rxjs";

import { BaseService } from "@/service-core";
import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

import { loginEffect, logoutEffect, postAuthSyncEffect, registerEffect } from "./effects";
import type { AuthEffectCtx } from "./types";
import { LoginStatus } from "./types";

// AuthService — 认证 Bounded Context
// ==================================================

export class AuthService extends BaseService {
  // 核心状态
  private _user$ = new BehaviorSubject<User | null>(this.initUser);
  readonly user$ = this._user$.asObservable();
  get user(): User | null {
    return this._user$.value;
  }

  private _loginStatus$ = new BehaviorSubject<LoginStatus>(this.initUser ? LoginStatus.LoggedIn : LoginStatus.LoggedOut);
  get loginStatus(): LoginStatus {
    return this._loginStatus$.value;
  }

  // UI 状态
  private _error$ = new BehaviorSubject<string>("");
  readonly error$ = this._error$.asObservable();
  get error(): string {
    return this._error$.value;
  }

  readonly pending$ = this._loginStatus$.pipe(map((s) => s === LoginStatus.Loading));
  get pending(): boolean {
    return this._loginStatus$.value === LoginStatus.Loading;
  }

  readonly loginSuccess$ = this._loginStatus$.pipe(
    pairwise(),
    filter(([prev, curr]) => prev !== LoginStatus.LoggedIn && curr === LoginStatus.LoggedIn),
    map(() => undefined),
  );

  // 内部命令流
  private _loginEvent$ = new Subject<LoginInput>();
  private _registerEvent$ = new Subject<RegisterInput>();
  private _logoutEvent$ = new Subject<void>();
  private _postAuthSync$ = new Subject<void>();

  constructor(private initUser: User | null = null) {
    super();

    // 构造上下文
    const ctx: AuthEffectCtx = {
      login$: this._loginEvent$,
      register$: this._registerEvent$,
      logout$: this._logoutEvent$,
      postAuthSync$: this._postAuthSync$,
      triggerPostAuthSync: () => this._postAuthSync$.next(),
      setUser: (user, status) => {
        this._user$.next(user);
        this._loginStatus$.next(status);
      },
      setStatus: (status) => this._loginStatus$.next(status),
      pushError: (msg) => this._error$.next(msg),
      clearError: () => this._error$.next(""),
    };

    // 注册副作用
    this.registerEffects(ctx, [postAuthSyncEffect, loginEffect, registerEffect, logoutEffect]);
  }

  // 命令入口
  login(data: LoginInput): void {
    this._loginEvent$.next(data);
  }

  register(data: RegisterInput): void {
    this._registerEvent$.next(data);
  }

  logout(): void {
    this._logoutEvent$.next();
  }
}
