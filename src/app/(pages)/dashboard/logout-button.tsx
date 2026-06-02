"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthService } from "@/service/auth.service";
import { useService } from "@/service-core";

import styles from "./logout-button.module.scss";

export function LogoutButton() {
  const auth = useService(AuthService);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await auth.logout();
      router.push("/login");
      router.refresh();
    } catch {
      // navigation will unmount anyway, but reset if fetch itself fails
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleLogout} disabled={loading} className={styles.button}>
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
