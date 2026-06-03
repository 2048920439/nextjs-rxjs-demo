/**
 * 生成 NaCl 加密密钥配置
 *
 * 非覆盖式更新：读取现有文件，只替换 export const KEY = "..." 中的值，
 * 文件中的其他内容（注释、额外配置等）不受影响。
 *
 * 输出两个文件，物理隔离客户端密钥和服务端密钥：
 *   - src/config/crypto-client.ts  客户端安全密钥
 *   - src/config/crypto-server.ts  服务端密钥（含 import "server-only"）
 *
 * 运行：node scripts/generate-crypto-keys.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const nacl = require("tweetnacl");
const naclUtil = require("tweetnacl-util");

// ════════════════════════════════════════════════════════════
// 密钥生成
// ════════════════════════════════════════════════════════════

const symmetricKey = naclUtil.encodeBase64(nacl.randomBytes(nacl.secretbox.keyLength));
const clientKeyPair = nacl.box.keyPair();
const serverKeyPair = nacl.box.keyPair();

/** 文件名 → { 变量名: base64 值 } */
const KEY_MAP = {
  "crypto-client.ts": {
    SYMMETRIC_KEY: symmetricKey,
    CLIENT_SECRET_KEY: naclUtil.encodeBase64(clientKeyPair.secretKey),
    SERVER_PUBLIC_KEY: naclUtil.encodeBase64(serverKeyPair.publicKey),
  },
  "crypto-server.ts": {
    CLIENT_PUBLIC_KEY: naclUtil.encodeBase64(clientKeyPair.publicKey),
    SERVER_SECRET_KEY: naclUtil.encodeBase64(serverKeyPair.secretKey),
  },
};

/** 新文件骨架（首次生成时使用） */
const FILE_TEMPLATES = {
  "crypto-client.ts": `// 由 scripts/generate-crypto-keys.mjs 自动生成
// 注意：生产环境应替换为真实的密钥并通过环境变量注入

`,
  "crypto-server.ts": `// 由 scripts/generate-crypto-keys.mjs 自动生成
// 注意：生产环境应替换为真实的密钥并通过环境变量注入

import "server-only";

`,
};

// ════════════════════════════════════════════════════════════
// 补丁逻辑：只替换 export const KEY = "旧值" → "新值"
// ════════════════════════════════════════════════════════════

/**
 * 在文件内容中更新指定 key 的值，仅替换引号内的部分。
 * 若 key 不存在，在文件末尾追加。
 */
function patchContent(content, key, newValue) {
  const quotedValue = JSON.stringify(newValue); // 自动转义 + 加引号
  const regex = new RegExp(`^(export const ${key} = )".*?"(;.*)$`, "m");

  if (regex.test(content)) {
    return content.replace(regex, `$1${quotedValue}$2`);
  }

  // 文件中不存在该 key，追加到末尾
  return content.trimEnd() + `\nexport const ${key} = ${quotedValue};\n`;
}

// ════════════════════════════════════════════════════════════
// 主流程
// ════════════════════════════════════════════════════════════

const __dirname = dirname(fileURLToPath(import.meta.url));
const configDir = resolve(__dirname, "..", "src", "config");

for (const [filename, replacements] of Object.entries(KEY_MAP)) {
  const filePath = resolve(configDir, filename);

  // 读取现有内容，不存在则使用模板
  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    content = FILE_TEMPLATES[filename] ?? "";
  }

  for (const [key, value] of Object.entries(replacements)) {
    content = patchContent(content, key, value);
  }

  writeFileSync(filePath, content, "utf-8");
  console.log(`  src/config/${filename}`);
}

console.log("Done.");
