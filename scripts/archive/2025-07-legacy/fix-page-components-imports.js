const { Project } = require("ts-morph");
const path = require("path");

function fixPageComponentsImports() {
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, "../apps/posmul-web/tsconfig.json"),
  });

  const sourceFiles = project.getSourceFiles();
  let changeCount = 0;

  sourceFiles.forEach((sourceFile) => {
    const filePath = sourceFile.getFilePath();

    // Skip files outside apps/posmul-web/src/app but not api
    if (
      !filePath.includes("apps/posmul-web/src/app") ||
      filePath.includes("src/app/api")
    ) {
      return;
    }

    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Fix bounded-contexts relative imports to absolute paths for page components
      if (moduleSpecifier.includes("../../../bounded-contexts/")) {
        const newPath = moduleSpecifier.replace(
          "../../../bounded-contexts/",
          "../../bounded-contexts/"
        );
        console.log(`Fixing page component import in: ${filePath}`);
        console.log(`  From: ${moduleSpecifier}`);
        console.log(`  To: ${newPath}`);
        importDecl.setModuleSpecifier(newPath);
        changeCount++;
      }

      // Fix other levels of relative bounded-contexts imports
      if (moduleSpecifier.includes("../../../../bounded-contexts/")) {
        const newPath = moduleSpecifier.replace(
          "../../../../bounded-contexts/",
          "../../../bounded-contexts/"
        );
        console.log(`Fixing page component import in: ${filePath}`);
        console.log(`  From: ${moduleSpecifier}`);
        console.log(`  To: ${newPath}`);
        importDecl.setModuleSpecifier(newPath);
        changeCount++;
      }
    });

    sourceFile.saveSync();
  });

  console.log(`Fixed ${changeCount} page component imports`);
}

if (require.main === module) {
  fixPageComponentsImports();
}

module.exports = { fixPageComponentsImports };
