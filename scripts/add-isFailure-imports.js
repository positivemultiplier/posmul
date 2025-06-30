#!/usr/bin/env node
/**
 * add-isFailure-imports.js
 * isFailure / isSuccess / unwrap 사용하지만 import 없을 때 자동 주입
 */
const { Project } = require("ts-morph");
const glob = require("glob");

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const files = glob.sync("{apps,packages}/**/*.{ts,tsx}");

files.forEach((filePath) => {
  const source = project.addSourceFileAtPathIfExists(filePath);
  if (!source) return;
  const text = source.getFullText();
  if (
    !/isFailure\(/.test(text) &&
    !/isSuccess\(/.test(text) &&
    !/unwrap\(/.test(text)
  )
    return;
  const existingImports = source
    .getImportDeclarations()
    .filter((d) => d.getModuleSpecifierValue() === "@posmul/shared-types");
  let importDecl = existingImports[0];
  if (!importDecl) {
    importDecl = source.addImportDeclaration({
      moduleSpecifier: "@posmul/shared-types",
      namedImports: [],
    });
  }
  const addNamed = (name) => {
    if (!importDecl.getNamedImports().some((n) => n.getName() === name)) {
      importDecl.addNamedImport(name);
    }
  };
  if (/isFailure\(/.test(text)) addNamed("isFailure");
  if (/isSuccess\(/.test(text)) addNamed("isSuccess");
  if (/unwrap\(/.test(text)) addNamed("unwrap");
  source.saveSync();
  console.log("fixed imports in", filePath);
});
