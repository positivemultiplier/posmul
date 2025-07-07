/**
 * shared-types 마이그레이션 정리 스크립트
 * 빈 import, 중복 TODO 주석, 잘못된 import 정리
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

function cleanupSharedTypesImports() {
  console.log('🧹 Cleaning up shared-types imports...');
  
  // apps 디렉토리의 모든 TypeScript 파일 찾기
  const files = glob.sync('apps/**/*.{ts,tsx}', { 
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'] 
  });
  
  let processedFiles = 0;
  let cleanedFiles = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;
      
      // 1. 빈 import 제거: import {  } from "@posmul/shared-types";
      const emptyImportPattern = /import\s*\{\s*\}\s*from\s*["']@posmul\/shared-types["'];[^\n]*\n?/g;
      if (emptyImportPattern.test(content)) {
        newContent = newContent.replace(emptyImportPattern, '');
        hasChanges = true;
      }
      
      // 2. 중복 TODO 주석 정리
      const duplicateTodoPattern = /(\/\/ TODO: SDK로 마이그레이션 필요\s*){2,}/g;
      if (duplicateTodoPattern.test(newContent)) {
        newContent = newContent.replace(duplicateTodoPattern, '// TODO: SDK로 마이그레이션 필요');
        hasChanges = true;
      }
      
      // 3. 빈 라인 정리
      const multipleEmptyLinesPattern = /\n\s*\n\s*\n/g;
      if (multipleEmptyLinesPattern.test(newContent)) {
        newContent = newContent.replace(multipleEmptyLinesPattern, '\n\n');
        hasChanges = true;
      }
      
      // 4. shared-types에서 사용할 수 있는 타입들을 SDK로 마이그레이션
      const availableInSDK = [
        'UserId', 'PredictionGameId', 'PredictionId', 'TransactionId',
        'ValidationError', 'AuthError', 'EconomyError', 'NetworkError',
        'AuthenticationError', 'ExternalServiceError', 'UserAlreadyExistsError',
        'InvalidCredentialsError', 'UserNotFoundError', 'DomainError',
        'BusinessLogicError', 'UseCaseError', 'InsufficientPointsError'
      ];
      
      // SDK에서 사용 가능한 타입들 마이그레이션
      const sharedTypesImportPattern = /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']@posmul\/shared-types["'];([^\n]*)/g;
      
      newContent = newContent.replace(sharedTypesImportPattern, (match, imports, comment) => {
        const importList = imports.split(',').map(imp => imp.trim()).filter(Boolean);
        const sdkTypes = [];
        const remainingTypes = [];
        
        for (const type of importList) {
          if (availableInSDK.includes(type)) {
            sdkTypes.push(type);
          } else {
            remainingTypes.push(type);
          }
        }
        
        let result = '';
        
        // SDK로 옮길 수 있는 타입들
        if (sdkTypes.length > 0) {
          result += `import { ${sdkTypes.join(', ')} } from "@posmul/auth-economy-sdk";\n`;
          hasChanges = true;
        }
        
        // 아직 남아있어야 하는 타입들
        if (remainingTypes.length > 0) {
          result += `import { ${remainingTypes.join(', ')} } from "@posmul/shared-types"; // TODO: SDK로 마이그레이션 필요`;
        }
        
        return result;
      });
      
      if (hasChanges) {
        fs.writeFileSync(filePath, newContent);
        cleanedFiles++;
        console.log(`✅ Cleaned: ${filePath}`);
      }
      
      processedFiles++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Cleanup completed!`);
  console.log(`📁 Files processed: ${processedFiles}`);
  console.log(`🧹 Files cleaned: ${cleanedFiles}`);
  
  return { processedFiles, cleanedFiles };
}

// 실행
cleanupSharedTypesImports();
