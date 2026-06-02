import { headers } from "next/headers";
import Link from "next/link";

import styles from "./not-found.module.scss";

export default async function GlobalNotFound() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // /rxjs/* 下的未匹配路由，显示带回首页的提示
  if (pathname.startsWith("/rxjs")) {
    return (
      <div className={styles.outer}>
        <div className={styles.wrapper}>
          <h1 className={styles.code}>404</h1>
          <p className={styles.text}>该 RxJS 学习页面不存在</p>
          <Link href="/rxjs" className={styles.link}>
            &larr; 返回 RxJS 首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.outer}>
      <div className={styles.wrapper}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.text}>页面未找到</p>
        <Link href="/" className={styles.link}>
          &larr; 返回首页
        </Link>
      </div>
    </div>
  );
}
