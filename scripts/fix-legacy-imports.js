#!/usr/bin/env node
/*
 * Fix all legacy @/bounded-contexts/* imports in web app
 * Usage: node scripts/fix-legacy-imports.js
 */

const { Project } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});

// Add all web app files
project.addSourceFilesAtPaths("apps/posmul-web/src/**/*.{ts,tsx,js,jsx}");

const mappings = [
  // Study-cycle and assessment to core package
  {
    regex:
      /^@\/bounded-contexts\/study_cycle\/(domain|application|infrastructure)\/(.*)$/,
    replacement: "@posmul/study-cycle-core/$1/$2",
  },
  {
    regex:
      /^@\/bounded-contexts\/assessment\/(domain|application|infrastructure)\/(.*)$/,
    replacement: "@posmul/study-cycle-core/$1/$2",
  },

  // Other bounded contexts - keep in web app for now
  {
    regex: /^@\/bounded-contexts\/(.*)$/,
    replacement: "../../../bounded-contexts/$1",
  },

  // Shared imports
  {
    regex: /^@\/shared\/types\/(.*)$/,
    replacement: "@posmul/shared-types",
  },
  {
    regex: /^@\/shared\/components\/(.*)$/,
    replacement: "@posmul/shared-ui",
  },
  {
    regex: /^@\/shared\/utils\/(.*)$/,
    replacement: "@posmul/shared-ui",
  },
  {
    regex: /^@\/shared\/mcp\/(.*)$/,
    replacement: "@posmul/shared-auth",
  },

  // Relative shared paths
  {
    regex: /^\.\.\/\.\.\/\.\.\/\.\.\/shared\/types\/(.*)$/,
    replacement: "@posmul/shared-types",
  },
  {
    regex: /^\.\.\/\.\.\/\.\.\/\.\.\/shared\/components\/(.*)$/,
    replacement: "@posmul/shared-ui",
  },
];

let totalChanges = 0;

project.getSourceFiles().forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  let fileChanged = false;

  sourceFile.getImportDeclarations().forEach((importDecl) => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    for (const mapping of mappings) {
      if (mapping.regex.test(moduleSpecifier)) {
        const newPath = moduleSpecifier.replace(
          mapping.regex,
          mapping.replacement
        );
        importDecl.setModuleSpecifier(newPath);
        console.log(`${filePath}: ${moduleSpecifier} → ${newPath}`);
        fileChanged = true;
        totalChanges++;
        break;
      }
    }
  });

  if (fileChanged) {
    sourceFile.saveSync();
  }
});

console.log(`\n✅ Total imports fixed: ${totalChanges}`);
