#!/usr/bin/env node
/*
 * Fix Result pattern misuse - accessing .error on success branch
 * 확장: result.error, result.error.message, throw, return, message, new Error 등 주요 패턴에 대해 isFailure 타입 가드 적용
 * Usage: node scripts/fix-result-pattern.js
 */

const { Project } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});

// Add all web app and core files
project.addSourceFilesAtPaths("apps/posmul-web/src/**/*.{ts,tsx,js,jsx}");
project.addSourceFilesAtPaths(
  "packages/study-cycle-core/src/**/*.{ts,tsx,js,jsx}"
);

let totalChanges = 0;

project.getSourceFiles().forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  let fileChanged = false;
  let text = sourceFile.getFullText();

  // Pattern 1: return failure(result.error);
  text = text.replace(
    /return\s+failure\((\w+)\.error\);/g,
    (match, resultVar) => {
      fileChanged = true;
      totalChanges++;
      return `if (isFailure(${resultVar})) {\n  return failure(${resultVar}.error);\n} else {\n  return failure(new Error(\"Unknown error\"));\n}`;
    }
  );

  // Pattern 2: throw new Error(result.error.message);
  text = text.replace(
    /throw new Error\((\w+)\.error\.message\);/g,
    (match, resultVar) => {
      fileChanged = true;
      totalChanges++;
      return `if (isFailure(${resultVar})) {\n  throw new Error(${resultVar}.error.message);\n} else {\n  throw new Error(\"Unknown error\");\n}`;
    }
  );

  // Pattern 3: message: result.error.message
  text = text.replace(
    /message:\s*(\w+)\.error\.message/g,
    (match, resultVar) => {
      fileChanged = true;
      totalChanges++;
      return `message: isFailure(${resultVar}) ? ${resultVar}.error.message : \"Unknown error\"`;
    }
  );

  // Pattern 4: result.error.message.includes(...)
  text = text.replace(
    /(\w+)\.error\.message\.includes\(([^)]+)\)/g,
    (match, resultVar, arg) => {
      fileChanged = true;
      totalChanges++;
      return `isFailure(${resultVar}) && ${resultVar}.error.message.includes(${arg})`;
    }
  );

  // Pattern 5: result.error (in throw, return, etc)
  text = text.replace(
    /throw new Error\((\w+)\.error\)/g,
    (match, resultVar) => {
      fileChanged = true;
      totalChanges++;
      return `if (isFailure(${resultVar})) {\n  throw new Error(${resultVar}.error);\n} else {\n  throw new Error(\"Unknown error\");\n}`;
    }
  );
  text = text.replace(/return failure\((\w+)\.error\)/g, (match, resultVar) => {
    fileChanged = true;
    totalChanges++;
    return `if (isFailure(${resultVar})) {\n  return failure(${resultVar}.error);\n} else {\n  return failure(new Error(\"Unknown error\"));\n}`;
  });

  // Pattern 6: error: result.error
  text = text.replace(/error:\s*(\w+)\.error/g, (match, resultVar) => {
    fileChanged = true;
    totalChanges++;
    return `error: isFailure(${resultVar}) ? ${resultVar}.error : new Error(\"Unknown error\")`;
  });

  // Pattern 7: result.error (standalone, e.g. logging)
  text = text.replace(
    /(console\.log|console\.error)\((\w+)\.error\)/g,
    (match, logFn, resultVar) => {
      fileChanged = true;
      totalChanges++;
      return `${logFn}(isFailure(${resultVar}) ? ${resultVar}.error : \"Unknown error\")`;
    }
  );

  if (fileChanged) {
    // isFailure import 추가 (중복 방지)
    let importAdded = false;
    const importRegex =
      /import\s+\{([^}]+)\}\s+from ['\"]@posmul\/shared-types['\"];?/;
    if (!importRegex.test(text)) {
      text = `import { isFailure } from '@posmul/shared-types';\n` + text;
      importAdded = true;
    } else if (!text.includes("isFailure")) {
      text = text.replace(importRegex, (match, imports) => {
        return `import {${imports.trim()}, isFailure} from '@posmul/shared-types';`;
      });
      importAdded = true;
    }
    sourceFile.replaceWithText(text);
    console.log(
      `${filePath}: Result pattern fixes applied${importAdded ? " (import added)" : ""}`
    );
    sourceFile.saveSync();
  }
});

console.log(`\n✅ Total Result pattern fixes: ${totalChanges}`);
