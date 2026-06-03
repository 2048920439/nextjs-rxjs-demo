"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction } from "@/lib/auth-actions";
import { AuthService } from "@/service/auth.service";
import { useService } from "@/service-core";

import styles from "./page.module.scss";

const initialState = { error: "", success: false };

export default function LoginPage() {
  const auth = useService(AuthService);
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      loginAction(initialState, formData)
        .then((result) => {
          if (!result.success) return Promise.reject(result.error);
          return auth.fetchUser().then(() => router.push("/"));
        })
        .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input id="email" name="email" type="email" required className={styles.input} placeholder="you@example.com" />
          </div>

          <div>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input id="password" name="password" type="password" required className={styles.input} placeholder="Your password" />
          </div>

          <button type="submit" disabled={isPending} className={clsx(styles.submitBtn, isPending ? styles.submitBtnLoading : styles.submitBtnActive)}>
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className={styles.hint}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
