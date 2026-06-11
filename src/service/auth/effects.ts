import { catchError, EMPTY, from, switchMap, tap } from "rxjs";

import { login as loginApi, logout as logoutApi, register as registerApi } from "@/api-client";
import type { Effect } from "@/service-core";

import type { AuthEffectCtx } from "./types";
import { LoginStatus } from "./types";

export const loginEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.login$
    .pipe(
      tap(() => ctx.pushUserState(LoginStatus.Loading)),
      switchMap((data) =>
        from(loginApi(data)).pipe(
          tap((user) => {
            ctx.pushUser(user);
            ctx.pushUserState(LoginStatus.LoggedIn);
            ctx.pushLoginState({ state: "success" });
          }),
          catchError((err: unknown) => {
            ctx.pushUserState(LoginStatus.LoggedOut);
            ctx.pushLoginState({ state: "failed", msg: err instanceof Error ? err.message : String(err) });
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();

export const registerEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.register$
    .pipe(
      tap(() => ctx.pushUserState(LoginStatus.Loading)),
      switchMap((data) =>
        from(registerApi(data)).pipe(
          tap((user) => {
            ctx.pushUser(user);
            ctx.pushUserState(LoginStatus.LoggedIn);
            ctx.pushRegisterState({ state: "success" });
          }),
          catchError((err: unknown) => {
            ctx.pushUserState(LoginStatus.LoggedOut);
            ctx.pushRegisterState({ state: "failed", msg: err instanceof Error ? err.message : String(err) });
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();

export const logoutEffect: Effect<AuthEffectCtx> = (ctx) =>
  ctx.logout$
    .pipe(
      switchMap(() =>
        from(logoutApi()).pipe(
          tap(() => {
            ctx.pushUser(null);
            ctx.pushUserState(LoginStatus.LoggedOut);
            ctx.pushLogoutState({ state: "success" });
          }),
          catchError((err: unknown) => {
            ctx.pushLogoutState({ state: "failed", msg: err instanceof Error ? err.message : String(err) });
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe();
