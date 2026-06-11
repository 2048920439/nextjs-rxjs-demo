"use client";

import { AuthService } from "@/service/auth";
import { useService } from "@/service-core";

import styles from "./logout-button.module.scss";

export function LogoutButton() {
  const auth = useService(AuthService);

  function handleLogout() {
    auth.logout();
  }

  return (
    <button onClick={handleLogout} className={styles.button}>
      Logout
    </button>
  );
}
