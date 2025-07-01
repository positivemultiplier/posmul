const { Project } = require("ts-morph");
const path = require("path");

function fixBoundedContextsImports() {
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, "../apps/posmul-web/tsconfig.json"),
  });

  const sourceFiles = project.getSourceFiles();
  let changeCount = 0;

  sourceFiles.forEach((sourceFile) => {
    const filePath = sourceFile.getFilePath();

    // Skip files outside apps/posmul-web
    if (!filePath.includes("apps/posmul-web")) {
      return;
    }

    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Fix auth value objects imports
      if (
        moduleSpecifier.includes(
          "bounded-contexts/auth/domain/value-objects/user-value-objects"
        )
      ) {
        console.log(`Fixing auth import in: ${filePath}`);
        importDecl.setModuleSpecifier("@posmul/shared-types");
        changeCount++;
      }

      // Fix prediction bounded context imports - convert to relative paths
      if (moduleSpecifier.includes("../../../bounded-contexts/prediction/")) {
        const newPath = moduleSpecifier.replace(
          "../../../bounded-contexts/prediction/",
          "../../../bounded-contexts/prediction/"
        );
        // Keep as relative path for now, but ensure it's correct
        console.log(`Keeping prediction import as relative: ${filePath}`);
      }

      // Fix investment bounded context imports
      if (moduleSpecifier.includes("../../../bounded-contexts/investment/")) {
        console.log(`Keeping investment import as relative: ${filePath}`);
      }

      // Fix donation bounded context imports
      if (moduleSpecifier.includes("../../../bounded-contexts/donation/")) {
        console.log(`Keeping donation import as relative: ${filePath}`);
      }
    });

    sourceFile.saveSync();
  });

  console.log(`Fixed ${changeCount} bounded-contexts imports`);
}

if (require.main === module) {
  fixBoundedContextsImports();
}

module.exports = { fixBoundedContextsImports };
