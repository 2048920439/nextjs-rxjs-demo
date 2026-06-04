"use client";

import Link from "next/link";

import { AuthService } from "@/service/auth.service";
import { useObservableState, useService } from "@/service-core";

import { LogoutButton } from "./_components/logout-button";
import styles from "./page.module.scss";

export default function Home() {
  const auth = useService(AuthService);
  const user = useObservableState(auth.user$, () => auth.user);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Next.js + RxJS Demo</h1>

      {user === undefined ? (
        <span className={styles.loadingText}>Loading...</span>
      ) : user ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Welcome, {user.name}!</h2>

          <div className={styles.info}>
            <p>
              <span className={styles.label}>Email:</span> {user.email}
            </p>
            <p>
              <span className={styles.label}>Joined:</span> {new Date(user.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>

          <div className={styles.actions}>
            <LogoutButton />
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Link href="/login" className={styles.btnBlue}>
            Login
          </Link>
          <Link href="/register" className={styles.btnGreen}>
            Register
          </Link>
        </div>
      )}

      <Link href="/rxjs" className={styles.rxjsLink}>
        Learn RxJS &rarr;
      </Link>

      <Link href="/service-playground" className={styles.playgroundLink}>
        Service Playground &rarr;
      </Link>
    </div>
  );
}
