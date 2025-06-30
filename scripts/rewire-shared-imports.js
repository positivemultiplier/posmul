#!/usr/bin/env node
/*
 * Rewire legacy `@/shared/**` and relative shared imports to new monorepo packages.
 * Usage:  node scripts/rewire-shared-imports.js <targetDir>
 */

const { Project } = require("ts-morph");
const path = require("path");

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("Usage: node scripts/rewire-shared-imports.js <targetDir>");
  process.exit(1);
}

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths(path.join(targetDir, "**/*.{ts,tsx,js,jsx}"));

const mappings = [
  { regex: /^@\/shared\/components\/.*/, replacement: "@posmul/shared-ui" },
  { regex: /^@\/shared\/utils\/.*/, replacement: "@posmul/shared-ui" },
  { regex: /^@\/shared\/types\/.*/, replacement: "@posmul/shared-types" },
  { regex: /^@\/shared\/mcp\/.*/, replacement: "@posmul/shared-auth" },
  // Any other @/shared/* goes to shared-ui for the moment
  { regex: /^@\/shared\/.*/, replacement: "@posmul/shared-ui" },
  // Deep relative paths to shared folder
  {
    regex: /^(?:\.\.\/)+shared\/components\/.*/,
    replacement: "@posmul/shared-ui",
  },
  { regex: /^(?:\.\.\/)+shared\/utils\/.*/, replacement: "@posmul/shared-ui" },
  {
    regex: /^(?:\.\.\/)+shared\/types\/.*/,
    replacement: "@posmul/shared-types",
  },
];

let fileCount = 0;
let changeCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let modified = false;
  sourceFile.getImportDeclarations().forEach((imp) => {
    const spec = imp.getModuleSpecifierValue();
    for (const { regex, replacement } of mappings) {
      if (regex.test(spec)) {
        imp.setModuleSpecifier(replacement);
        modified = true;
        changeCount += 1;
        break;
      }
    }
  });
  if (modified) {
    sourceFile.saveSync();
    fileCount += 1;
  }
}

console.log(
  `Rewired imports in ${fileCount} files, ${changeCount} import statements updated.`
);
