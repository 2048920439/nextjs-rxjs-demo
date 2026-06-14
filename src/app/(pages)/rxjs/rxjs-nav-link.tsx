"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

import styles from "./layout.module.scss";

interface RxjsNavLinkProps extends PropsWithChildren {
  href: string;
}

export default function RxjsNavLink({ href, children }: RxjsNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={clsx(styles.navLink, isActive && styles.navLinkActive)} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
