import { existsSync, readdirSync } from "fs";
import Link from "next/link";
import { join } from "path";
import type { PropsWithChildren, ReactNode } from "react";

import styles from "./layout.module.scss";

// ====== 类型定义 ======

interface PageNode {
  /** 目录名（URL 路径段） */
  slug: string;
  /** 展示标题 */
  title: string;
  /** 相对于 /rxjs 的完整 URL 路径 */
  path: string;
  /** 子页面（递归） */
  children: PageNode[];
}

// ====== 工具函数 ======

/** 将 slug 中的标题部分转为展示文本（不含序号） */
function slugToText(slug: string): string {
  // 去掉数字前缀 "01-" 后转换
  const text = slug.replace(/^\d+-/, "");
  return text
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** 将 slug 转为展示标题（数字部分按指定宽度补零） */
function slugToTitle(slug: string, padWidth: number): string {
  const key = extractSortKey(slug);
  if (key.num === Infinity) return slugToText(slug);
  return `${String(key.num).padStart(padWidth, "0")} ${slugToText(slug)}`;
}

/** 判断目录名是否为 Next.js 路由组 "(xxx)" */
function isRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")");
}

/** 判断目录名是否为 Next.js 动态路由段 "[xxx]" / "[...xxx]" / "[[...xxx]]" */
function isDynamicSegment(name: string): boolean {
  return name.startsWith("[") && name.endsWith("]");
}

/**
 * 提取目录名的排序 key，按数字前缀数值优先排序
 * 如 "01-observable" → { num: 1, rest: "-observable" }
 * 无前缀 → { num: Infinity, rest: slug }
 */
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

/**
 * 统一格式化本层所有节点的标题序号宽度
 * 如节点编号 1~12 → 全部补零到 2 位（01, 02, ..., 12）
 */
function normalizeTitles(nodes: PageNode[]): void {
  // 计算最大序号位数
  const nums = nodes.map((n) => extractSortKey(n.slug).num).filter((n) => n !== Infinity);
  if (nums.length === 0) return;

  const maxNum = Math.max(...nums);
  const width = String(maxNum).length;

  for (const node of nodes) {
    node.title = slugToTitle(node.slug, width);
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
    const hasPage = existsSync(join(subDir, "page.tsx"));
    const childUrlPath = urlPath ? `${urlPath}/${name}` : `/${name}`;

    // 有 page.tsx → 是页面节点，继续扫描其下的子页面
    if (hasPage) {
      const children = scanPages(subDir, childUrlPath);
      nodes.push({
        slug: name,
        title: slugToText(name),
        path: childUrlPath,
        children,
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
        });
      }
    }
  }

  // 按数字前缀数值排序（1 < 2 < 10），无前缀的排在最后
  nodes.sort(compareNode);

  // 统一格式化：计算所需补零宽度，确保序号格式一致
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
