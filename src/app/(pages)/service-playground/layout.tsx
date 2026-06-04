import { existsSync, readdirSync, readFileSync } from "fs";
import Link from "next/link";
import { join } from "path";
import type { PropsWithChildren, ReactNode } from "react";

import styles from "./layout.module.scss";

// ====== 类型定义 ======

interface PageMeta {
  chapter: string;
  chapterTitle: string;
}

interface PageNode {
  slug: string;
  title: string;
  path: string;
  children: PageNode[];
  meta: PageMeta | null;
}

// ====== 元数据提取 ======

function extractPageMeta(pageFilePath: string): PageMeta | null {
  try {
    const content = readFileSync(pageFilePath, "utf-8");
    const titleMatch = content.match(/export\s+const\s+metadata\s*(?::\s*\w+)?\s*=\s*\{[^}]*title\s*:\s*['"]([^'"]+)['"]/);
    if (!titleMatch) return null;

    const title = titleMatch[1];
    const parts = title.match(/^([\d.]+)\s+(.+)/);
    if (parts) {
      return { chapter: parts[1], chapterTitle: parts[2] };
    }
  } catch {
    // 忽略
  }
  return null;
}

// ====== 排序与解析 ======

function slugToText(slug: string): string {
  const text = slug.replace(/^\d+-/, "");
  return text
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractSortKey(slug: string): { num: number; rest: string } {
  const match = slug.match(/^(\d+)(-.*)?$/);
  if (match) {
    return { num: parseInt(match[1], 10), rest: match[2] ?? "" };
  }
  return { num: Infinity, rest: slug };
}

function compareNode(a: PageNode, b: PageNode): number {
  const ka = extractSortKey(a.slug);
  const kb = extractSortKey(b.slug);
  if (ka.num !== kb.num) return ka.num - kb.num;
  return ka.rest.localeCompare(kb.rest);
}

function isRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")");
}

function isDynamicSegment(name: string): boolean {
  return name.startsWith("[") && name.endsWith("]");
}

// ====== 标题格式化 ======

function parseChapter(chapter: string): number[] {
  return chapter.split(".").map(Number);
}

function formatMetaTitle(meta: PageMeta, padWidths: number[]): string {
  const parts = parseChapter(meta.chapter);
  const padded = parts.map((n, i) => String(n).padStart(padWidths[i] ?? 1, "0")).join(".");
  return `${padded} ${meta.chapterTitle}`;
}

function normalizeTitles(nodes: PageNode[]): void {
  const chapters = nodes
    .map((n) => n.meta?.chapter)
    .filter((c): c is string => !!c)
    .map(parseChapter);

  const padWidths: number[] = [];
  if (chapters.length > 0) {
    const maxParts = Math.max(...chapters.map((p) => p.length));
    for (let i = 0; i < maxParts; i++) {
      const maxVal = Math.max(...chapters.map((p) => p[i] ?? 0));
      padWidths.push(String(maxVal).length);
    }
  }

  for (const node of nodes) {
    if (node.meta) {
      node.title = formatMetaTitle(node.meta, padWidths);
    } else {
      node.title = slugToText(node.slug);
    }
    if (node.children.length > 0) {
      normalizeTitles(node.children);
    }
  }
}

// ====== 递归扫描 ======

function scanPages(dirPath: string, urlPath: string): PageNode[] {
  if (!existsSync(dirPath)) return [];

  let entries: { name: string; isDirectory(): boolean }[];
  try {
    entries = readdirSync(dirPath, { withFileTypes: true }) as unknown as typeof entries;
  } catch {
    return [];
  }

  const nodes: PageNode[] = [];

  for (const entry of entries) {
    const { name } = entry;

    if (!entry.isDirectory() || name.startsWith("_") || isDynamicSegment(name)) continue;

    if (isRouteGroup(name)) {
      const children = scanPages(join(dirPath, name), urlPath);
      nodes.push(...children);
      continue;
    }

    const subDir = join(dirPath, name);
    const pageFilePath = join(subDir, "page.tsx");
    const hasPage = existsSync(pageFilePath);
    const childUrlPath = urlPath ? `${urlPath}/${name}` : `/${name}`;

    if (hasPage) {
      const children = scanPages(subDir, childUrlPath);
      const meta = extractPageMeta(pageFilePath);
      nodes.push({
        slug: name,
        title: "",
        path: childUrlPath,
        children,
        meta,
      });
    } else {
      const children = scanPages(subDir, childUrlPath);
      if (children.length > 0) {
        nodes.push({
          slug: name,
          title: slugToText(name),
          path: childUrlPath,
          children,
          meta: null,
        });
      }
    }
  }

  nodes.sort(compareNode);
  normalizeTitles(nodes);

  return nodes;
}

// ====== 递归渲染组件 ======

function NavTree({ nodes, depth = 0 }: { nodes: PageNode[]; depth?: number }): ReactNode {
  if (nodes.length === 0) return null;

  return (
    <ul className={depth === 0 ? styles.navList : styles.navSubList}>
      {nodes.map((node) => (
        <li key={node.path} className={styles.navItem}>
          <Link href={`/service-playground${node.path}`} className={styles.navLink}>
            {node.title}
          </Link>
          {node.children.length > 0 && <NavTree nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

// ====== Layout ======

export default function ServicePlaygroundLayout({ children }: PropsWithChildren) {
  const playgroundDir = join(process.cwd(), "src", "app", "(pages)", "service-playground");
  const pageTree = scanPages(playgroundDir, "");

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            &larr; 返回首页
          </Link>

          <h2 className={styles.navTitle}>
            <Link href="/service-playground" className={styles.navTitleLink}>
              Service Playground
            </Link>
          </h2>

          {pageTree.length > 0 ? <NavTree nodes={pageTree} /> : <p className={styles.navEmpty}>暂无子页面</p>}
        </nav>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
