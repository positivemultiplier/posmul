#!/usr/bin/env node
/**
 * add-project-id-param.js
 * 모든 mcp_supabase_execute_sql 호출에 project_id: "fabyagohqqnusmnwekuc" 주입
 */

const { Project } = require("ts-morph");
const glob = require("glob");
const path = require("path");

const PROJECT_ID = "fabyagohqqnusmnwekuc";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

const files = glob.sync("{apps,packages}/**/*.{ts,tsx}");

files.forEach((filePath) => {
  const source = project.addSourceFileAtPathIfExists(filePath);
  if (!source) return;
  let modified = false;
  source.forEachDescendant((node) => {
    if (node.getKindName() === "CallExpression") {
      const call = node;
      const ident = call.getExpression().getText();
      if (ident === "mcp_supabase_execute_sql") {
        const arg = call.getArguments()[0];
        if (arg && arg.getKindName() === "ObjectLiteralExpression") {
          const obj = arg;
          const hasProject = obj.getProperty("project_id");
          if (!hasProject) {
            obj.addPropertyAssignment({
              name: "project_id",
              initializer: `"${PROJECT_ID}"`,
            });
            modified = true;
          }
        }
      }
    }
  });
  if (modified) {
    source.saveSync();
    console.log("updated", filePath);
  }
});
