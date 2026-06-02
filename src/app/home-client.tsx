"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  name: string;
}

export function HomeClient() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold">Next.js + RxJS Demo</h1>

      <div className="flex items-center gap-4">
        {user === undefined ? (
          <span className="text-gray-400">Loading...</span>
        ) : user ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <span className="text-gray-600">Hello, {user.name}</span>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </>
  );
}
