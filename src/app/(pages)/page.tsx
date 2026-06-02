"use client";

import Link from "next/link";

import { AuthService } from "@/service/auth.service";
import { useObservableState, useService } from "@/service-core";

import styles from "./page.module.scss";

export default function Home() {
  const auth = useService(AuthService);
  const user = useObservableState(auth.user$, () => auth.user);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Next.js + RxJS Demo</h1>

      <div className={styles.actions}>
        {user === undefined ? (
          <span className={styles.loadingText}>Loading...</span>
        ) : user ? (
          <>
            <Link href="/dashboard" className={styles.btnBlue}>
              Dashboard
            </Link>
            <span className={styles.greeting}>Hello, {user.name}</span>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.btnBlue}>
              Login
            </Link>
            <Link href="/register" className={styles.btnGreen}>
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
