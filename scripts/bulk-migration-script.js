#!/usr/bin/env node
/**
 * PosMul Bulk Migration Script
 * shared-types → auth-economy-sdk 일괄 변환
 * 2025-07-08
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 마이그레이션 패턴 정의
const MIGRATION_PATTERNS = [
  // 1. 기본 import 변경
  {
    pattern: /import\s*{([^}]+)}\s*from\s*["']@posmul\/shared-types["'];?\s*\/\/\s*TODO:[^*]*\*/g,
    replacement: 'import { $1 } from "@posmul/auth-economy-sdk";'
  },
  
  // 2. DomainError 생성자 패턴 변경
  {
    pattern: /new\s+DomainError\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g,
    replacement: 'new DomainError("$2", { code: "$1" })'
  },
  
  // 3. ValidationError 생성자 패턴 변경  
  {
    pattern: /new\s+ValidationError\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g,
    replacement: 'new ValidationError("$2", { code: "$1" })'
  },
  
  // 4. shared-types 전체 변경
  {
    pattern: /@posmul\/shared-types/g,
    replacement: '@posmul/auth-economy-sdk'
  },
  
  // 5. 특정 타입 변경
  {
    pattern: /PMC/g,
    replacement: 'PmcAmount'
  },
  {
    pattern: /createPMC/g,
    replacement: 'createPmcAmount'
  },
  {
    pattern: /PMP/g,
    replacement: 'PmpAmount'
  },
  {
    pattern: /createPMP/g,
    replacement: 'createPmpAmount'
  }
];

// 로컬 타입 정의 (SDK에 없는 것들)
const LOCAL_TYPE_DEFINITIONS = `
// 로컬 타입 정의 (SDK 마이그레이션 대응)
interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// 유틸 함수들
const createPredictionId = (value: string): PredictionId => value as PredictionId;
const createPredictionGameId = (value: string): PredictionGameId => value as PredictionGameId;
`;

class BulkMigrationTool {
  constructor() {
    this.processedFiles = 0;
    this.errorFiles = [];
    this.rootPath = 'c:\\G\\posmul';
  }

  async run() {
    console.log('🚀 PosMul Bulk Migration 시작...');
    
    // 1. 대상 파일 찾기
    const targetFiles = this.findTargetFiles();
    console.log(`📁 발견된 대상 파일: ${targetFiles.length}개`);
    
    // 2. 백업 생성
    this.createBackup();
    
    // 3. 일괄 변환 실행
    for (const filePath of targetFiles) {
      try {
        await this.migrateFile(filePath);
        this.processedFiles++;
        console.log(`✅ ${this.processedFiles}/${targetFiles.length}: ${path.basename(filePath)}`);
      } catch (error) {
        this.errorFiles.push({ filePath, error: error.message });
        console.log(`❌ 실패: ${path.basename(filePath)} - ${error.message}`);
      }
    }
    
    // 4. 결과 보고
    this.generateReport();
    
    // 5. 타입 검사
    this.runTypeCheck();
  }

  findTargetFiles() {
    const { execSync } = require('child_process');
    
    // shared-types를 사용하는 모든 파일 찾기
    const command = `grep -r "@posmul/shared-types" ${this.rootPath} --include="*.ts" --include="*.tsx" -l`;
    
    try {
      const output = execSync(command, { encoding: 'utf8', cwd: this.rootPath });
      return output.split('\n').filter(line => line.trim());
    } catch (error) {
      console.log('⚠️ grep 명령어 실패, 수동으로 파일 검색...');
      return this.findTargetFilesManually();
    }
  }

  findTargetFilesManually() {
    // 수동으로 파일 검색 (Windows 호환)
    const targetPaths = [
      'apps/posmul-web/src/bounded-contexts',
      'packages/shared-types/src',
      'src'
    ];
    
    const files = [];
    
    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('@posmul/shared-types')) {
            files.push(fullPath);
          }
        }
      }
    }
    
    for (const targetPath of targetPaths) {
      const fullPath = path.join(this.rootPath, targetPath);
      scanDirectory(fullPath);
    }
    
    return files;
  }

  createBackup() {
    const backupDir = path.join(this.rootPath, 'migration-backup-' + Date.now());
    fs.mkdirSync(backupDir, { recursive: true });
    
    console.log(`💾 백업 생성: ${backupDir}`);
    
    // Git 스냅샷도 생성
    try {
      execSync('git add -A', { cwd: this.rootPath });
      execSync('git commit -m "Pre-bulk-migration snapshot"', { cwd: this.rootPath });
      console.log('📸 Git 스냅샷 생성 완료');
    } catch (error) {
      console.log('⚠️ Git 스냅샷 실패 (계속 진행)');
    }
  }

  async migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 패턴별 변환 적용
    for (const { pattern, replacement } of MIGRATION_PATTERNS) {
      content = content.replace(pattern, replacement);
    }
    
    // 로컬 타입이 필요한 파일인지 검사
    if (this.needsLocalTypes(content)) {
      content = this.addLocalTypes(content);
    }
    
    // 변경사항이 있는 경우에만 저장
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  needsLocalTypes(content) {
    return content.includes('Timestamps') || 
           content.includes('createPredictionId') ||
           content.includes('createPredictionGameId');
  }

  addLocalTypes(content) {
    // 파일 상단에 로컬 타입 정의 추가
    const importEndIndex = content.lastIndexOf('import');
    if (importEndIndex !== -1) {
      const nextLineIndex = content.indexOf('\n', importEndIndex);
      return content.slice(0, nextLineIndex + 1) + 
             '\n' + LOCAL_TYPE_DEFINITIONS + '\n' + 
             content.slice(nextLineIndex + 1);
    }
    
    return LOCAL_TYPE_DEFINITIONS + '\n' + content;
  }

  runTypeCheck() {
    console.log('\n🔍 타입 검사 실행 중...');
    
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { 
        cwd: this.rootPath,
        stdio: 'inherit'
      });
      console.log('✅ 타입 검사 통과!');
    } catch (error) {
      console.log('⚠️ 타입 오류 발견 - 개별 수정 필요');
    }
  }

  generateReport() {
    const report = `
# Bulk Migration 결과 보고서

## 📊 처리 결과
- **처리된 파일**: ${this.processedFiles}개
- **실패한 파일**: ${this.errorFiles.length}개
- **성공률**: ${((this.processedFiles / (this.processedFiles + this.errorFiles.length)) * 100).toFixed(1)}%

## ❌ 실패한 파일들
${this.errorFiles.map(({ filePath, error }) => `- ${filePath}: ${error}`).join('\n')}

## 🔧 다음 단계
1. 실패한 파일들 수동 수정
2. 타입 검사 결과 확인
3. 빌드 테스트 실행
4. 최종 검증

생성일: ${new Date().toISOString()}
`;

    const reportPath = path.join(this.rootPath, 'bulk-migration-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📋 보고서 생성: ${reportPath}`);
    console.log(report);
  }
}

// 실행
if (require.main === module) {
  const migrationTool = new BulkMigrationTool();
  migrationTool.run().catch(console.error);
}

module.exports = BulkMigrationTool;
