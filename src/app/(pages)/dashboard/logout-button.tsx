"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthService } from "@/service/auth.service";
import { useService } from "@/service-core";

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
    <button onClick={handleLogout} disabled={loading} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-300">
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
