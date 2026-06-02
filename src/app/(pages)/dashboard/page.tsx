import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { LogoutButton } from "./logout-button";
import styles from "./page.module.scss";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>

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

      <div className={styles.back}>
        <Link href="/" className={styles.backLink}>
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
