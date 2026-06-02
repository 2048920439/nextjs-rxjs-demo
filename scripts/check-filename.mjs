/**
 * Git pre-commit 文件命名检查脚本
 * 检查暂存区文件是否符合 kebab-case 命名规范：
 * - 全部小写字母
 * - 单词间使用短横线（-）连接
 * - 禁止大写字母和下划线
 */

import { execSync } from "node:child_process";
import { basename } from "node:path";

// 需要检查的源文件扩展名
const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|sass)$/;

// 需要跳过的特殊文件名（精确匹配）
const SKIP_FILES = new Set(["next-env.d.ts"]);

// kebab-case 正则：只允许小写字母、数字、短横线、点号
const KEBAB_CASE_RE = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9]+)*$/;

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf-8",
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function checkFilename(filePath) {
  const name = basename(filePath);

  // 跳过特殊文件
  if (SKIP_FILES.has(name)) return null;

  // 只检查源文件
  if (!SOURCE_EXTENSIONS.test(name)) return null;

  // 去掉扩展名检查基本名称
  const nameWithoutExt = name.replace(/\.[^.]+$/, "");

  if (!KEBAB_CASE_RE.test(nameWithoutExt)) {
    return {
      path: filePath,
      name,
      suggestion:
        nameWithoutExt
          .replace(/_/g, "-")
          .replace(/([A-Z])/g, (_, c) => "-" + c.toLowerCase())
          .replace(/--+/g, "-")
          .replace(/^-|-$/g, "") + name.slice(nameWithoutExt.length),
    };
  }

  return null;
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  process.exit(0);
}

const invalidFiles = [];
for (const file of stagedFiles) {
  const result = checkFilename(file);
  if (result) {
    invalidFiles.push(result);
  }
}

if (invalidFiles.length > 0) {
  console.error("\n❌ 文件命名不符合 kebab-case 规范（小写字母 + 短横线连接）：\n");
  for (const file of invalidFiles) {
    console.error(`  ${file.path}`);
    console.error(`  建议重命名为: ${file.suggestion}\n`);
  }
  console.error("请将文件名改为全部小写字母，单词间使用短横线（-）连接。\n");
  console.error("例如: UserProfile.tsx → user-profile.tsx\n");
  process.exit(1);
}

console.log("✅ 文件命名检查通过");
process.exit(0);
