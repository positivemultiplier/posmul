const fs = require('fs');
const path = require('path');

console.log('🔍 Searching for JSON files that might cause parsing errors...');

// Check for files that might be read during Next.js startup
const possibleFiles = [
  'apps/posmul-web/src/shared/types/supabase-generated.ts',
  'packages/shared-types/src/supabase-generated.ts'
];

for (const filePath of possibleFiles) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      console.log(`\n📂 ${filePath}`);
      console.log(`📊 Lines: ${lines.length}`);
      console.log(`📏 Size: ${Math.round(content.length / 1024)} KB`);
      
      // Check around line 6694 if file is large enough
      if (lines.length > 6694) {
        console.log(`🎯 Line 6694: ${lines[6693]?.substring(0, 100)}...`);
        
        // Look for potential JSON parsing issues
        if (lines[6693]?.includes('JSON') || lines[6693]?.includes('{') || lines[6693]?.includes('}')) {
          console.log('⚠️  Potential JSON content found around error line');
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
  }
}

// Check if Universal MCP script might be creating problematic JSON
const mcpPath = 'C:/G/mcp-automation/universal-mcp-automation.ts';
if (fs.existsSync(mcpPath)) {
  console.log('\n🚀 Universal MCP script found');
  console.log('📁 Path:', mcpPath);
}

console.log('\n✅ Search completed');
