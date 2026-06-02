"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthService } from "@/service/auth.service";
import { useService } from "@/service-core";

import styles from "./page.module.scss";

export default function LoginPage() {
  const auth = useService(AuthService);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
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
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Your password"
            />
          </div>

          <button type="submit" disabled={loading} className={clsx(styles.submitBtn, loading ? styles.submitBtnLoading : styles.submitBtnActive)}>
            {loading ? "Logging in..." : "Login"}
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
