#!/usr/bin/env tsx

/**
 * 🌟 Universal MCP Automation System
 *
 * ✅ 모든 도메인 적용 가능
 * ✅ 다른 프로젝트 확장 가능
 * ✅ 다양한 데이터베이스 지원
 * ✅ 완전 자동화 파이프라인
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// 🎯 범용 설정 인터페이스
interface AutomationConfig {
  projectId: string;
  projectName: string;
  outputPath: string;
  domains?: string[];
  customHeader?: string;
  additionalTypes?: string;
}

// 🔧 사전 정의된 프로젝트 설정들
const PRESET_CONFIGS: Record<string, AutomationConfig> = {
  posmul: {
    projectId: "fabyagohqqnusmnwekuc",
    projectName: "PosMul AI-era 직접민주주의 플랫폼",
    outputPath: "src/shared/types/supabase-generated.ts",
    domains: [
      "prediction",
      "economy",
      "investment",
      "donation",
      "forum",
      "auth",
      "user",
      "payment",
    ],
  },

  // 다른 프로젝트 예시
  ecommerce: {
    projectId: "your-ecommerce-project-id",
    projectName: "E-commerce Platform",
    outputPath: "src/types/database.ts",
    domains: ["products", "orders", "users", "payments"],
  },

  blog: {
    projectId: "your-blog-project-id",
    projectName: "Blog Platform",
    outputPath: "types/supabase.ts",
    domains: ["posts", "users", "comments", "categories"],
  },
};

// 🎨 동적 헤더 생성
function generateHeader(config: AutomationConfig): string {
  const timestamp = new Date().toISOString();
  const domains = config.domains?.join(", ") || "all domains";

  return `/**
 * ${config.projectName} - Supabase 자동 생성 타입
 * 
 * 🕒 생성 시간: ${timestamp}
 * 🆔 프로젝트 ID: ${config.projectId}
 * 🏗️ 적용 도메인: ${domains}
 * 
 * 🔥 수동 편집 금지! 이 파일은 자동 생성됩니다.
 * 🔥 MCP mcp_supabase_generate_typescript_types 결과 기반
 * 
 * 🚀 Universal MCP Automation System으로 생성됨
 */

`;
}

// 📊 도메인별 통계 생성
function generateDomainStats(mcpResult: string, domains: string[]): string {
  const stats = domains
    .map((domain) => {
      const tableCount = (mcpResult.match(new RegExp(domain, "gi")) || [])
        .length;
      return `//   ${domain}: ${tableCount}개 관련 테이블`;
    })
    .join("\n");

  return `
// 📊 도메인별 테이블 통계:
${stats}
//
// 🔄 자동 업데이트: npm run generate-types
// 🛠️ 수동 적용: node scripts/apply-mcp-types.js

`;
}

// 🌟 메인 자동화 함수
export async function generateUniversalTypes(
  configName: string | AutomationConfig,
  mcpResult: string
): Promise<{
  success: boolean;
  outputPath: string;
  fileSize: number;
  tableCount: number;
  domains: string[];
}> {
  try {
    // 설정 로드
    const config =
      typeof configName === "string" ? PRESET_CONFIGS[configName] : configName;

    if (!config) {
      throw new Error(`Unknown config: ${configName}`);
    }

    // 출력 디렉토리 생성
    const outputDir = join(
      process.cwd(),
      config.outputPath.split("/").slice(0, -1).join("/")
    );
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // 헤더 생성
    const header = config.customHeader || generateHeader(config);

    // 도메인 통계 생성
    const domainStats = config.domains
      ? generateDomainStats(mcpResult, config.domains)
      : "";

    // 추가 타입 포함
    const additionalTypes = config.additionalTypes || "";

    // 최종 컨텐츠 조립
    const fullContent = header + domainStats + mcpResult + additionalTypes;

    // 파일 저장
    const fullOutputPath = join(process.cwd(), config.outputPath);
    writeFileSync(fullOutputPath, fullContent, "utf8");

    // 통계 계산
    const tableCount = (mcpResult.match(/Tables:/g) || []).length;
    const fileSize = Math.round((fullContent.length / 1024) * 100) / 100;

    // 결과 출력
    console.log(`✅ ${config.projectName} 타입 생성 완료!`);
    console.log(`📁 파일: ${config.outputPath}`);
    console.log(`📊 크기: ${fileSize} KB`);
    console.log(`🏗️ 도메인: ${config.domains?.length || 0}개`);
    console.log(`📋 테이블: ${tableCount}개`);
    console.log(`🚀 Universal MCP Automation 적용됨!`);

    return {
      success: true,
      outputPath: fullOutputPath,
      fileSize,
      tableCount,
      domains: config.domains || [],
    };
  } catch (error) {
    console.error("❌ 타입 생성 실패:", error);
    return {
      success: false,
      outputPath: "",
      fileSize: 0,
      tableCount: 0,
      domains: [],
    };
  }
}

// 🎯 도메인별 특화 생성
export async function generateDomainSpecificTypes(
  configName: string,
  domain: string,
  mcpResult: string
): Promise<boolean> {
  const config = PRESET_CONFIGS[configName];
  if (!config || !config.domains?.includes(domain)) {
    console.error(
      `❌ 도메인 '${domain}'은 '${configName}' 프로젝트에서 지원되지 않습니다.`
    );
    return false;
  }

  // 도메인별 타입 파일 생성
  const domainOutputPath = `src/bounded-contexts/${domain}/types/supabase-${domain}.ts`;
  const domainConfig: AutomationConfig = {
    ...config,
    outputPath: domainOutputPath,
    domains: [domain],
    customHeader: `/**
 * ${domain.toUpperCase()} Domain - Supabase 타입
 * 생성 시간: ${new Date().toISOString()}
 * 프로젝트: ${config.projectName}
 */

`,
  };

  const result = await generateUniversalTypes(domainConfig, mcpResult);
  return result.success;
}

// 🔄 배치 처리 (모든 도메인)
export async function generateAllDomainTypes(
  configName: string,
  mcpResult: string
): Promise<{ success: number; failed: number; domains: string[] }> {
  const config = PRESET_CONFIGS[configName];
  if (!config || !config.domains) {
    throw new Error(`Invalid config or no domains defined for: ${configName}`);
  }

  let success = 0;
  let failed = 0;
  const processedDomains: string[] = [];

  console.log(`🚀 ${config.domains.length}개 도메인 일괄 처리 시작...`);

  for (const domain of config.domains) {
    const result = await generateDomainSpecificTypes(
      configName,
      domain,
      mcpResult
    );
    if (result) {
      success++;
      console.log(`✅ ${domain} 도메인 완료`);
    } else {
      failed++;
      console.log(`❌ ${domain} 도메인 실패`);
    }
    processedDomains.push(domain);
  }

  console.log(`📊 배치 처리 완료: 성공 ${success}개, 실패 ${failed}개`);

  return { success, failed, domains: processedDomains };
}

// 🌍 새 프로젝트 설정 추가
export function addProjectConfig(name: string, config: AutomationConfig): void {
  PRESET_CONFIGS[name] = config;
  console.log(`✅ 새 프로젝트 설정 추가됨: ${name}`);
}

// 📋 사용 가능한 설정 목록
export function listAvailableConfigs(): void {
  console.log("🎯 사용 가능한 프로젝트 설정:");
  Object.entries(PRESET_CONFIGS).forEach(([name, config]) => {
    console.log(
      `  • ${name}: ${config.projectName} (${
        config.domains?.length || 0
      }개 도메인)`
    );
  });
}

// 🔧 CLI 인터페이스
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "list":
      listAvailableConfigs();
      break;

    case "generate":
      const configName = args[1] || "posmul";
      const mcpResult = args[2] || "";
      if (!mcpResult) {
        console.error("❌ MCP 결과가 필요합니다.");
        process.exit(1);
      }
      generateUniversalTypes(configName, mcpResult);
      break;

    case "batch":
      const batchConfig = args[1] || "posmul";
      const batchMcpResult = args[2] || "";
      if (!batchMcpResult) {
        console.error("❌ MCP 결과가 필요합니다.");
        process.exit(1);
      }
      generateAllDomainTypes(batchConfig, batchMcpResult);
      break;

    default:
      console.log(`
🌟 Universal MCP Automation System

사용법:
  tsx scripts/universal-mcp-automation.ts list                    # 사용 가능한 설정 목록
  tsx scripts/universal-mcp-automation.ts generate [config]      # 전체 타입 생성
  tsx scripts/universal-mcp-automation.ts batch [config]         # 모든 도메인 일괄 생성

예시:
  tsx scripts/universal-mcp-automation.ts generate posmul
  tsx scripts/universal-mcp-automation.ts batch posmul
      `);
  }
}

export default {
  generateUniversalTypes,
  generateDomainSpecificTypes,
  generateAllDomainTypes,
  addProjectConfig,
  listAvailableConfigs,
  PRESET_CONFIGS,
};
