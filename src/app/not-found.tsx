import { existsSync, readdirSync } from "fs";
import { headers } from "next/headers";
import Link from "next/link";
import { join } from "path";

import styles from "./not-found.module.scss";

const PAGES_DIR = join(process.cwd(), "src", "app", "(pages)");

function isRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")");
}

/** 检查 URL 路径在文件系统中是否有对应的 page.tsx，支持穿透路由组 */
function pageExists(pathname: string, baseDir: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return checkDir(baseDir, segments);
}

function checkDir(baseDir: string, segments: string[]): boolean {
  if (segments.length === 0) {
    return existsSync(join(baseDir, "page.tsx"));
  }

  const [next, ...rest] = segments;

  // 先尝试直连路径
  const direct = join(baseDir, next);
  if (existsSync(direct)) {
    return checkDir(direct, rest);
  }

  // 穿透路由组 (如 (auth)、(sub) 等) 继续查找
  try {
    const entries = readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && isRouteGroup(entry.name)) {
        const groupPath = join(baseDir, entry.name, next);
        if (existsSync(groupPath) && checkDir(groupPath, rest)) {
          return true;
        }
      }
    }
  } catch {
    // 目录不存在
  }

  return false;
}

/** 从 pathname 向上逐级查找最近的有效父路由 */
function findNearestRoute(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  while (segments.length > 0) {
    const candidate = "/" + segments.join("/");
    if (pageExists(candidate, PAGES_DIR)) {
      return candidate;
    }
    segments.pop();
  }

  return "/";
}

export default async function GlobalNotFound() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const nearestRoute = findNearestRoute(pathname);

  return (
    <div className={styles.outer}>
      <div className={styles.wrapper}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.text}>页面未找到</p>
        <Link href={nearestRoute} className={styles.link}>
          &larr; 返回{nearestRoute === "/" ? "首页" : ` ${nearestRoute}`}
        </Link>
      </div>
    </div>
  );
}
