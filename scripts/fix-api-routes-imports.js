const { Project } = require("ts-morph");
const path = require("path");

function fixApiRoutesImports() {
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, "../apps/posmul-web/tsconfig.json"),
  });

  const sourceFiles = project.getSourceFiles();
  let changeCount = 0;

  sourceFiles.forEach((sourceFile) => {
    const filePath = sourceFile.getFilePath();

    // Skip files outside apps/posmul-web/src/app/api
    if (!filePath.includes("apps/posmul-web/src/app/api")) {
      return;
    }

    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Fix bounded-contexts relative imports to absolute paths
      if (moduleSpecifier.includes("../../../bounded-contexts/")) {
        const newPath = moduleSpecifier.replace(
          "../../../bounded-contexts/",
          "../../../../bounded-contexts/"
        );
        console.log(`Fixing API route import in: ${filePath}`);
        console.log(`  From: ${moduleSpecifier}`);
        console.log(`  To: ${newPath}`);
        importDecl.setModuleSpecifier(newPath);
        changeCount++;
      }

      // Fix other relative bounded-contexts imports
      if (moduleSpecifier.includes("../../bounded-contexts/")) {
        const newPath = moduleSpecifier.replace(
          "../../bounded-contexts/",
          "../../../bounded-contexts/"
        );
        console.log(`Fixing API route import in: ${filePath}`);
        console.log(`  From: ${moduleSpecifier}`);
        console.log(`  To: ${newPath}`);
        importDecl.setModuleSpecifier(newPath);
        changeCount++;
      }
    });

    sourceFile.saveSync();
  });

  console.log(`Fixed ${changeCount} API route imports`);
}

if (require.main === module) {
  fixApiRoutesImports();
}

module.exports = { fixApiRoutesImports };
