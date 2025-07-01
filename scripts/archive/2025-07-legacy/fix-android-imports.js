#!/usr/bin/env node
/**
 * fix-android-imports.js
 * --------------------------------------
 * Android 앱 소스(apps/android/src) 내부에 남아있는 잘못된 모듈 경로를
 * 최신 모노레포 패키지 네임스페이스로 교정합니다.
 *
 * 1. `@posmul/shared-ui/errors` → `@posmul/shared-types`
 * 2. `@posmul/shared-ui/types`  → `@posmul/shared-types`
 *
 * 이 스크립트는 문자열 치환 기반으로, import 선언뿐 아니라 dynamic import/require
 * 구문도 함께 수정합니다.
 *
 * Usage:
 *   node scripts/fix-android-imports.js [targetDir]
 *   # targetDir 기본값: apps/android/src
 */

const fs = require("fs");
const path = require("path");

// ---- CLI Args ----
const targetDirArg = process.argv[2] || path.join("apps", "android", "src");
const targetDir = path.resolve(targetDirArg);
if (!fs.existsSync(targetDir)) {
  console.error(`❌ Target directory not found: ${targetDir}`);
  process.exit(1);
}

// ---- Mapping Rules ----
const mapping = [
  {
    pattern: /"@posmul\/shared-ui\/errors"/g,
    replacement: '"@posmul/shared-types"',
  },
  {
    pattern: /"@posmul\/shared-ui\/types"/g,
    replacement: '"@posmul/shared-types"',
  },
];

// ---- Helper: Recursively collect files ----
function getSourceFiles(dir, exts, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ("node_modules" === entry.name || "dist" === entry.name) continue;
      getSourceFiles(fullPath, exts, files);
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// ---- Process individual file ----
function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  for (const { pattern, replacement } of mapping) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

// ---- Run ----
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const allFiles = getSourceFiles(targetDir, EXTENSIONS);
let changed = 0;
for (const file of allFiles) {
  if (processFile(file)) changed += 1;
}

console.log(`✅ Android import fix completed. ${changed} file(s) updated.`);
