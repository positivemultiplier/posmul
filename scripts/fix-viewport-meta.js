const fs = require("fs/promises");
const path = require("path");
const glob = require("glob");

(async () => {
  const pattern = path.resolve(
    process.cwd(),
    "apps/posmul-web/src/app/**/*.{ts,tsx}"
  );
  const files = glob.sync(pattern, { nodir: true });
  for (const file of files) {
    let content = await fs.readFile(file, "utf8");
    if (!/metadata\s*=\s*\{[^}]*viewport[^}]*\}/.test(content)) continue;
    const updated = content.replace(
      /export const metadata\s*=\s*\{([\s\S]*?)viewport\s*:\s*([^,}]*),?([\s\S]*?)\};?/m,
      (_match, before, viewportVal, after) => {
        return `export const metadata = {${before}${after}};\n\nexport const viewport = ${viewportVal};`;
      }
    );
    await fs.writeFile(file, updated, "utf8");
    console.log("✔ migrated viewport in", path.relative(process.cwd(), file));
  }
})();
