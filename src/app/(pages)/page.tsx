"use client";

import Link from "next/link";

import { AuthService } from "@/service/auth.service";
import { useObservableState, useService } from "@/service-core";

export default function Home() {
  const auth = useService(AuthService);
  const user = useObservableState(auth.user$, () => auth.user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Next.js + RxJS Demo</h1>

      <div className="flex items-center gap-4">
        {user === undefined ? (
          <span className="text-gray-400">Loading...</span>
        ) : user ? (
          <>
            <Link href="/dashboard" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Dashboard
            </Link>
            <span className="text-gray-600">Hello, {user.name}</span>
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Login
            </Link>
            <Link href="/register" className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
