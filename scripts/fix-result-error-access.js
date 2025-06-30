const fs = require("fs/promises");
const path = require("path");
const glob = require("glob");

/**
 * Codemod: replace direct `.error` property access on Result union types
 * with a guarded pattern using `isFailure()` utility.
 *
 * Scope: prediction bounded-context & shared events within apps/posmul-web.
 */

async function run() {
  const ROOT = path.resolve(__dirname, "../apps/posmul-web/src");
  const PATTERNS = [
    "bounded-contexts/prediction/**/*.ts",
    "bounded-contexts/prediction/**/*.tsx",
    "shared/events/**/*.ts",
  ];

  const files = PATTERNS.flatMap((p) => glob.sync(path.join(ROOT, p)));

  for (const file of files) {
    let content = await fs.readFile(file, "utf8");

    // Skip if no `.error` present
    if (!content.includes(".error")) continue;

    let updated = content;
    let modified = false;

    // Simple regex: variable.error => isFailure(variable) ? variable.error : undefined
    updated = updated.replace(/([a-zA-Z0-9_]+)\.error/g, (match, varName) => {
      modified = true;
      return `isFailure(${varName}) ? ${varName}.error : undefined`;
    });

    if (!modified) continue;

    // Ensure import for isFailure exists
    if (!/isFailure\s+from/.test(updated)) {
      const importRegex = /import[^;]+;\s*/;
      const m = importRegex.exec(updated);
      if (m) {
        const importLine =
          'import { isFailure } from "@posmul/shared-types";\n';
        updated =
          updated.slice(0, m.index + m[0].length) +
          importLine +
          updated.slice(m.index + m[0].length);
      } else {
        // No import statements, prepend at top
        updated =
          `import { isFailure } from "@posmul/shared-types";\n` + updated;
      }
    }

    await fs.writeFile(file, updated, "utf8");
    console.log("✔ patched", path.relative(process.cwd(), file));
  }
}

run().catch((err) => {
  console.error("Codemod failed", err);
  process.exit(1);
});
