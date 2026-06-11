import { catchError, EMPTY, from, switchMap, tap } from "rxjs";

import { login as loginApi, logout as logoutApi, register as registerApi } from "@/api-client";
import type { Effect } from "@/service-core";

import type { AuthEffectCtx } from "./types";

export const loginEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.login$
    .pipe(
      tap(() => ctx.setLoading()),
      switchMap((data) =>
        from(loginApi(data)).pipe(
          tap((user) => ctx.loginSuccess(user)),
          catchError((err: unknown) => {
            ctx.loginFailed(err instanceof Error ? err.message : String(err));
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();

export const registerEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.register$
    .pipe(
      tap(() => ctx.setLoading()),
      switchMap((data) =>
        from(registerApi(data)).pipe(
          tap((user) => ctx.registerSuccess(user)),
          catchError((err: unknown) => {
            ctx.registerFailed(err instanceof Error ? err.message : String(err));
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();

export const logoutEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.logout$
    .pipe(
      tap(() => ctx.setLoading()),
      switchMap(() =>
        from(logoutApi()).pipe(
          tap(() => ctx.logoutSuccess()),
          catchError((err: unknown) => {
            ctx.logoutFailed(err instanceof Error ? err.message : String(err));
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();
