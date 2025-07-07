/**
 * 대량 마이그레이션 스크립트
 * shared-types에서 auth-economy-sdk로 import 변경
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 마이그레이션 대상 패턴들
const patterns = [
  {
    from: /import\s*{\s*([^}]*)\s*}\s*from\s*["']@posmul\/shared-types["'];?/g,
    to: (match, imports) => {
      // SDK로 마이그레이션 가능한 타입들
      const sdkAvailableTypes = [
        // 기본 타입들
        'UserId', 'PredictionGameId', 'PredictionId', 'TransactionId',
        'Result', 'isFailure', 'isSuccess',
        // 경제 시스템 타입
        'PMP', 'PMC', 'AccuracyScore',
        // 페이징 타입
        'PaginationParams', 'PaginatedResult',
        // 에러 타입
        'ValidationError', 'AuthError', 'EconomyError', 'NetworkError',
        // 기타 공통 타입
        'ApiResponse', 'PaginationQuery',
        // 공통 유틸리티
        'failure', 'success'
      ];
      
      const importList = imports.split(',').map(i => i.trim());
      
      const sdkImports = [];
      const remainingImports = [];
      
      importList.forEach(imp => {
        if (sdkAvailableTypes.includes(imp)) {
          sdkImports.push(imp);
        } else {
          remainingImports.push(imp);
        }
      });
      
      let result = '';
      if (sdkImports.length > 0) {
        result += `import { ${sdkImports.join(', ')} } from "@posmul/auth-economy-sdk";\n`;
      }
      if (remainingImports.length > 0) {
        result += `import { ${remainingImports.join(', ')} } from "@posmul/shared-types"; // TODO: SDK로 마이그레이션 필요`;
      }
      
      return result;
    }
  },
  // 타입 전용 import 패턴
  {
    from: /import\s*type\s*{\s*([^}]*)\s*}\s*from\s*["']@posmul\/shared-types["'];?/g,
    to: (match, imports) => {
      const sdkAvailableTypes = [
        'UserId', 'PredictionGameId', 'PredictionId', 'TransactionId',
        'Result', 'PMP', 'PMC', 'AccuracyScore',
        'PaginationParams', 'PaginatedResult',
        'ValidationError', 'AuthError', 'EconomyError',
        'ApiResponse', 'PaginationQuery'
      ];
      
      const importList = imports.split(',').map(i => i.trim());
      
      const sdkImports = [];
      const remainingImports = [];
      
      importList.forEach(imp => {
        if (sdkAvailableTypes.includes(imp)) {
          sdkImports.push(imp);
        } else {
          remainingImports.push(imp);
        }
      });
      
      let result = '';
      if (sdkImports.length > 0) {
        result += `import type { ${sdkImports.join(', ')} } from "@posmul/auth-economy-sdk";\n`;
      }
      if (remainingImports.length > 0) {
        result += `import type { ${remainingImports.join(', ')} } from "@posmul/shared-types"; // TODO: SDK로 마이그레이션 필요`;
      }
      
      return result;
    }
  }
];

// 파일 처리 함수
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.from, (match, ...args) => {
      hasChanges = true;
      return pattern.to(match, ...args);
    });
    content = newContent;
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes: ${filePath}`);
  }
}

// 메인 실행
function main() {
  console.log('Starting Enhanced Migration: shared-types → auth-economy-sdk');
  
  const searchPatterns = [
    'apps/posmul-web/src/**/*.ts',
    'apps/posmul-web/src/**/*.tsx',
    'apps/study-cycle/src/**/*.ts',
    'apps/study-cycle/src/**/*.tsx'
  ];
  
  let allFiles = [];
  
  searchPatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] });
    allFiles = allFiles.concat(files);
  });
  
  // 중복 제거
  allFiles = [...new Set(allFiles)];
  
  console.log(`Found ${allFiles.length} TypeScript files to process`);
  
  let processedCount = 0;
  let updatedCount = 0;
  
  allFiles.forEach(file => {
    try {
      const beforeContent = fs.readFileSync(file, 'utf8');
      processFile(file);
      const afterContent = fs.readFileSync(file, 'utf8');
      
      processedCount++;
      if (beforeContent !== afterContent) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });
  
  console.log('\n=== Migration Summary ===');
  console.log(`📁 Total files processed: ${processedCount}`);
  console.log(`✅ Files updated: ${updatedCount}`);
  console.log(`⏭️  Files unchanged: ${processedCount - updatedCount}`);
  console.log('🎉 Enhanced migration completed!');
}

// 필요한 패키지 체크
try {
  require('glob');
} catch (e) {
  console.error('Please install glob: pnpm add -D glob');
  process.exit(1);
}

main();
