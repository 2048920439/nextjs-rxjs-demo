"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthService, LoginStatus } from "@/service/auth";
import { useObservable, useObservableState, useService } from "@/service-core";

import styles from "./page.module.scss";

export default function RegisterPage() {
  const auth = useService(AuthService);
  const router = useRouter();
  const pending = useObservableState(auth.userState$, () => auth.userState === LoginStatus.Loading);
  const [error, setError] = useState("");
  useObservable(auth.registerFailed$, (msg) => setError(msg));

  // 注册成功后跳转
  useObservable(auth.registerSuccess$, () => router.push("/"));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    auth.register({ email, password, name });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Register</h1>

        <form onSubmit={handleSubmit} className={styles.form} onChange={() => error && setError("")}>
          {error && <div className={styles.error}>{error}</div>}

          <div>
            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input id="name" name="name" type="text" required className={styles.input} placeholder="Your name" />
          </div>

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
            <input id="password" name="password" type="password" required className={styles.input} placeholder="At least 6 characters" />
          </div>

          <button type="submit" disabled={pending} className={clsx(styles.submitBtn, pending ? styles.submitBtnLoading : styles.submitBtnActive)}>
            {pending ? "Registering..." : "Register"}
          </button>
        </form>

        <p className={styles.hint}>
          Already have an account?{" "}
          <Link href="/login" className={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
