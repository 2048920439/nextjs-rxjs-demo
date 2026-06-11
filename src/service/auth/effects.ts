import { catchError, EMPTY, from, switchMap, tap } from "rxjs";

import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from "@/api-client";
import type { Effect } from "@/service-core";

import type { AuthEffectCtx } from "./types";
import { LoginStatus } from "./types";

// 副作用编排函数
// ==================================================

export const loginEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.login$
    .pipe(
      tap(() => {
        ctx.clearError();
        ctx.setStatus(LoginStatus.Loading);
      }),
      switchMap((data) =>
        from(loginApi(data)).pipe(
          tap((user) => ctx.setUser(user, LoginStatus.LoggedIn)),
          catchError((err: unknown) => {
            ctx.pushError(err instanceof Error ? err.message : String(err));
            ctx.setStatus(LoginStatus.LoggedOut);
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();

export const registerEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.register$
    .pipe(
      tap(() => {
        ctx.clearError();
        ctx.setStatus(LoginStatus.Loading);
      }),
      switchMap((data) =>
        from(registerApi(data)).pipe(
          switchMap(() => from(loginApi({ email: data.email, password: data.password }))),
          tap((user) => ctx.setUser(user, LoginStatus.LoggedIn)),
          catchError((err: unknown) => {
            ctx.pushError(err instanceof Error ? err.message : String(err));
            ctx.setStatus(LoginStatus.LoggedOut);
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();

export const logoutEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.logout$
    .pipe(
      switchMap(() => from(logoutApi()).pipe(catchError(() => EMPTY))),
      tap(() => ctx.setUser(null, LoginStatus.LoggedOut)),
    )
    .subscribe();

/** 刷新用户信息（SSR 水合后 / 手动触发）：成功设 LoggedIn，失败报错并回 LoggedOut */
export const postAuthSyncEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.postAuthSync$
    .pipe(
      switchMap(() =>
        from(getMe()).pipe(
          tap((user) => ctx.setUser(user, LoginStatus.LoggedIn)),
          catchError((err: unknown) => {
            ctx.pushError(err instanceof Error ? err.message : String(err));
            ctx.setStatus(LoginStatus.LoggedOut);
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();
