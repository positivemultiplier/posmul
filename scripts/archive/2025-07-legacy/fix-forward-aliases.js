#!/usr/bin/env node
/**
 * fix-forward-aliases.js
 * --------------------------------------
 * This script replaces dynamic import strings (e.g. "@/shared/mcp/...")
 * or require targets that still use the legacy alias path pattern
 * with their corresponding monorepo package names.
 *
 * Usage:
 *   node scripts/fix-forward-aliases.js <targetDir>
 *
 * Example:
 *   node scripts/fix-forward-aliases.js packages/study-cycle-core/src
 *
 * The script is intentionally string-based (no AST) so that it can also
 * handle dynamic `import()` expressions and `require()` calls which do
 * not appear in the statically analysed import declaration list that
 * `ts-morph` uses.
 */

const fs = require("fs");
const path = require("path");

if (process.argv.length < 3) {
  console.error("Usage: node scripts/fix-forward-aliases.js <targetDir>");
  process.exit(1);
}

const targetDir = process.argv[2];

const mapping = [
  // Specific mappings first (longest → shortest)
  {
    pattern: /"@\/shared\/mcp\/supabase-client"/g,
    replacement: '"@posmul/shared-auth"',
  },
  {
    pattern: /"@\/shared\/types\/([^"]*)"/g,
    replacement: '"@posmul/shared-types/$1"',
  },
  {
    pattern: /"@\/shared\/components\/([^"]*)"/g,
    replacement: '"@posmul/shared-ui/$1"',
  },
  {
    pattern: /"@\/shared\/utils\/([^"]*)"/g,
    replacement: '"@posmul/shared-ui/$1"',
  },
  {
    pattern: /"@\/shared\/hooks\/([^"]*)"/g,
    replacement: '"@posmul/shared-ui/$1"',
  },
  // Fallback: any other path under @/shared/** maps to shared-ui keeping subpath
  {
    pattern: /"@\/shared\/(.+?)"/g,
    replacement: '"@posmul/shared-ui/$1"',
  },
];

/**
 * Recursively traverse directory and return a list of files with the given extensions.
 */
function getAllFiles(dir, exts, allFiles = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and build outputs
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "build"
      ) {
        continue;
      }
      getAllFiles(fullPath, exts, allFiles);
    } else if (exts.includes(path.extname(entry.name))) {
      allFiles.push(fullPath);
    }
  }
  return allFiles;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let newContent = content;
  let replaced = false;

  for (const { pattern, replacement } of mapping) {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement);
      replaced = true;
    }
  }

  if (replaced) {
    fs.writeFileSync(filePath, newContent, "utf8");
    return true;
  }
  return false;
}

const exts = [".ts", ".tsx", ".js", ".jsx"];
const files = getAllFiles(targetDir, exts);
let changedFiles = 0;

for (const file of files) {
  if (processFile(file)) {
    changedFiles += 1;
  }
}

console.log(
  `Alias path replacement completed: ${changedFiles} file(s) updated.`
);
