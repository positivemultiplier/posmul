#!/usr/bin/env node
/**
 * fix-shared-ui-type-imports.js
 * --------------------------------------
 * Some files still import domain/application types (Result, Error, etc.) from
 * `@posmul/shared-ui`. Those types actually live in `@posmul/shared-types`.
 * This script rewrites such import declarations.
 *
 * Usage:
 *   node scripts/fix-shared-ui-type-imports.js <targetDir>
 */

const { Project } = require("ts-morph");
const path = require("path");

const targetDir = process.argv[2];
if (!targetDir) {
  console.error(
    "Usage: node scripts/fix-shared-ui-type-imports.js <targetDir>"
  );
  process.exit(1);
}

const TYPE_NAMES = new Set([
  "Result",
  "success",
  "failure",
  "DomainError",
  "ValidationError",
  "BusinessRuleError",
  "EconomicError",
  "RepositoryError",
]);

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths(path.join(targetDir, "**/*.{ts,tsx,js,jsx}"));

let updatedFiles = 0;
let movedSpecifiers = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileModified = false;
  sourceFile.getImportDeclarations().forEach((imp) => {
    if (imp.getModuleSpecifierValue() !== "@posmul/shared-ui") return;
    const namedImports = imp.getNamedImports();
    const typeSpecifiers = namedImports.filter((n) =>
      TYPE_NAMES.has(n.getName())
    );
    const movedNames = typeSpecifiers.map((n) => n.getName());
    if (typeSpecifiers.length === 0) return;

    // Remove type specifiers from current declaration
    for (const spec of typeSpecifiers) {
      spec.remove();
    }

    // If declaration left with no specifiers, remove entire import
    if (imp.getNamedImports().length === 0) imp.remove();

    // Add or update shared-types import
    let sharedTypesImport = sourceFile.getImportDeclaration(
      (d) => d.getModuleSpecifierValue() === "@posmul/shared-types"
    );
    if (!sharedTypesImport) {
      sharedTypesImport = sourceFile.addImportDeclaration({
        moduleSpecifier: "@posmul/shared-types",
        namedImports: [],
      });
    }
    const existing = new Set(
      sharedTypesImport.getNamedImports().map((n) => n.getName())
    );
    for (const name of movedNames) {
      if (!existing.has(name)) {
        sharedTypesImport.addNamedImport(name);
      }
      movedSpecifiers += 1;
    }
    fileModified = true;
  });
  if (fileModified) {
    sourceFile.saveSync();
    updatedFiles += 1;
  }
}

console.log(
  `Moved ${movedSpecifiers} specifier(s) in ${updatedFiles} file(s).`
);
