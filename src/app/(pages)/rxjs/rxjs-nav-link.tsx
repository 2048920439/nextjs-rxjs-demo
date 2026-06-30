"use client";

import { useMount } from "ahooks";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useRef } from "react";

import styles from "./layout.module.scss";

interface RxjsNavLinkProps extends PropsWithChildren {
  href: string;
}

export default function RxjsNavLink({ href, children }: RxjsNavLinkProps) {
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  useMount(() => {
    if (!isActive) return;

    linkRef.current?.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
  });

  return (
    <Link ref={linkRef} href={href} className={clsx(styles.navLink, isActive && styles.navLinkActive)} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
