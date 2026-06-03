import { existsSync, readdirSync, readFileSync } from "fs";
import Link from "next/link";
import { join } from "path";
import type { PropsWithChildren, ReactNode } from "react";

import styles from "./layout.module.scss";

// ====== 类型定义 ======

/** 页面元数据：由各 page.tsx 导出，用于侧边栏展示章节序号与中文标题 */
interface PageMeta {
  /** 章节号，如 "1.1"、"2.3.1" */
  chapter: string;
  /** 中文标题 */
  chapterTitle: string;
}

interface PageNode {
  /** 目录名（URL 路径段） */
  slug: string;
  /** 展示标题 */
  title: string;
  /** 相对于 /rxjs 的完整 URL 路径 */
  path: string;
  /** 子页面（递归） */
  children: PageNode[];
  /** 页面导出的元数据（有 page.tsx 时尝试提取） */
  meta: PageMeta | null;
}

// ====== 元数据提取 ======

/**
 * 从 page.tsx 中解析 export const metadata.title
 * 约定 title 格式为 "章节号 中文标题"（如 "1.1 一个简单的RxJS例子"）
 */
function extractPageMeta(pageFilePath: string): PageMeta | null {
  try {
    const content = readFileSync(pageFilePath, "utf-8");
    // 匹配 metadata 对象中的 title 字段
    const titleMatch = content.match(/export\s+const\s+metadata\s*(?::\s*\w+)?\s*=\s*\{[^}]*title\s*:\s*['"]([^'"]+)['"]/);
    if (!titleMatch) return null;

    const title = titleMatch[1];
    // "1.1 一个简单的RxJS例子" → chapter="1.1", chapterTitle="一个简单的RxJS例子"
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

/** 将 slug 中的标题部分转为展示文本（不含序号） */
function slugToText(slug: string): string {
  const text = slug.replace(/^\d+-/, "");
  return text
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** 提取目录名的数字前缀用于排序 */
function extractSortKey(slug: string): { num: number; rest: string } {
  const match = slug.match(/^(\d+)(-.*)?$/);
  if (match) {
    return { num: parseInt(match[1], 10), rest: match[2] ?? "" };
  }
  return { num: Infinity, rest: slug };
}

/** 比较两个 PageNode：先按数字前缀数值，再按剩余字符串 */
function compareNode(a: PageNode, b: PageNode): number {
  const ka = extractSortKey(a.slug);
  const kb = extractSortKey(b.slug);
  if (ka.num !== kb.num) return ka.num - kb.num;
  return ka.rest.localeCompare(kb.rest);
}

/** 判断目录名是否为 Next.js 路由组 "(xxx)" */
function isRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")");
}

/** 判断目录名是否为 Next.js 动态路由段 "[xxx]" / "[...xxx]" / "[[...xxx]]" */
function isDynamicSegment(name: string): boolean {
  return name.startsWith("[") && name.endsWith("]");
}

// ====== 标题格式化 ======

/** 将章节号字符串拆分为数字数组 */
function parseChapter(chapter: string): number[] {
  return chapter.split(".").map(Number);
}

/** 使用 PageMeta 生成带补零章节号的展示标题 */
function formatMetaTitle(meta: PageMeta, padWidths: number[]): string {
  const parts = parseChapter(meta.chapter);
  const padded = parts.map((n, i) => String(n).padStart(padWidths[i] ?? 1, "0")).join(".");
  return `${padded} ${meta.chapterTitle}`;
}

/**
 * 统一格式化本层节点的标题
 * 优先使用 pageMeta 的章节号 + 中文标题；
 * 无 meta 时回退到 slug 解析的文本标题。
 */
function normalizeTitles(nodes: PageNode[]): void {
  // 收集所有 meta 的章节号，计算每级补零宽度
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
    // 递归处理子层
    if (node.children.length > 0) {
      normalizeTitles(node.children);
    }
  }
}

// ====== 递归扫描 ======

/**
 * 递归扫描目录，返回页面树结构
 * @param dirPath  文件系统绝对路径
 * @param urlPath  当前层级对应的 URL 路径（从 /rxjs 起）
 */
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

    // 跳过下划线前缀的目录、非目录项、动态路由段
    if (!entry.isDirectory() || name.startsWith("_") || isDynamicSegment(name)) continue;

    // 路由组 "(sub)" —— 透明穿透，不加入 URL，也不生成导航节点
    if (isRouteGroup(name)) {
      const children = scanPages(join(dirPath, name), urlPath);
      nodes.push(...children);
      continue;
    }

    const subDir = join(dirPath, name);
    const pageFilePath = join(subDir, "page.tsx");
    const hasPage = existsSync(pageFilePath);
    const childUrlPath = urlPath ? `${urlPath}/${name}` : `/${name}`;

    // 有 page.tsx → 是页面节点，尝试提取 pageMeta
    if (hasPage) {
      const children = scanPages(subDir, childUrlPath);
      const meta = extractPageMeta(pageFilePath);
      nodes.push({
        slug: name,
        title: "", // 由 normalizeTitles 统一填充
        path: childUrlPath,
        children,
        meta,
      });
    } else {
      // 无 page.tsx → 检查是否有子孙页面，有则作为分组目录
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

  // 按数字前缀数值排序（1 < 2 < 10），无前缀的排在最后
  nodes.sort(compareNode);

  // 统一格式化标题
  normalizeTitles(nodes);

  return nodes;
}

// ====== 递归渲染组件 ======

/** 递归渲染导航树 */
function NavTree({ nodes, depth = 0 }: { nodes: PageNode[]; depth?: number }): ReactNode {
  if (nodes.length === 0) return null;

  return (
    <ul className={depth === 0 ? styles.navList : styles.navSubList}>
      {nodes.map((node) => (
        <li key={node.path} className={styles.navItem}>
          <Link href={`/rxjs${node.path}`} className={styles.navLink}>
            {node.title}
          </Link>
          {node.children.length > 0 && <NavTree nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

// ====== Layout ======

export default function RxjsLayout({ children }: PropsWithChildren) {
  const rxjsDir = join(process.cwd(), "src", "app", "(pages)", "rxjs");
  const pageTree = scanPages(rxjsDir, "");

  return (
    <div className={styles.layout}>
      {/* 侧边目录导航 */}
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            &larr; 返回首页
          </Link>

          <h2 className={styles.navTitle}>
            <Link href="/rxjs" className={styles.navTitleLink}>
              RxJS 学习
            </Link>
          </h2>

          {pageTree.length > 0 ? <NavTree nodes={pageTree} /> : <p className={styles.navEmpty}>暂无子页面</p>}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className={styles.content}>{children}</main>
    </div>
  );
}
