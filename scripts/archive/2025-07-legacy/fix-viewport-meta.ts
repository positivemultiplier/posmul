import { promises as fs } from "fs";
import glob from "glob";
import path from "path";

/**
 * Simple codemod: finds Next.js page files exporting `metadata = { viewport: ... }`
 * and converts to separate `export const viewport = { ... }` per Next 15 guideline.
 */
async function run() {
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
      (match, before, viewportVal, after) => {
        return (
          `export const metadata = {${before}${after}};\n\n` +
          `export const viewport = ${viewportVal};`
        );
      }
    );
    await fs.writeFile(file, updated, "utf8");
    console.log(
      `✔ migrated viewport in ${path.relative(process.cwd(), file)}`
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
