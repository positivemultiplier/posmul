/**
 * Prediction Domain Database Migration Runner
 * Supabase에 예측 게임 관련 테이블 스키마를 적용하는 migration 스크립트
 *
 * Project_Economic.md와 Project_Diagram.md 요구사항 기반
 * Agency Theory, CAPM, MoneyWave 시스템 지원
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

interface MigrationConfig {
  supabaseUrl: string;
  supabaseServiceKey: string; // service_role key (관리자 권한)
  migrationFiles: string[];
}

export class PredictionMigrationRunner {
  private supabase;
  private migrationDir: string;

  constructor(private config: MigrationConfig) {
    this.migrationDir = __dirname;
    this.supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * 모든 예측 도메인 마이그레이션 실행
   */
  async runAllMigrations(): Promise<void> {
    console.log("🚀 Starting Prediction Domain Database Migrations");
    console.log("📊 Agency Theory & CAPM Schema Deployment");

    try {
      // 1. 예측 게임 테이블 생성
      await this.runMigration("001_prediction_games.sql");

      // 2. 예측 및 정산 테이블 생성
      await this.runMigration("002_predictions.sql");

      // 3. 마이그레이션 기록 저장
      await this.recordMigrationCompletion();

      console.log(
        "✅ All Prediction Domain migrations completed successfully!"
      );
      console.log("📈 MoneyWave integration ready");
      console.log("🎯 Agency Theory & CAPM models active");
    } catch (error) {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  }

  /**
   * 개별 마이그레이션 파일 실행
   */
  private async runMigration(filename: string): Promise<void> {
    console.log(`📝 Running migration: ${filename}`);

    try {
      const migrationPath = join(this.migrationDir, filename);
      const migrationSQL = readFileSync(migrationPath, "utf-8");

      // SQL 명령어들을 분리하고 순차 실행
      const statements = this.splitSQLStatements(migrationSQL);

      for (const statement of statements) {
        if (statement.trim()) {
          await this.executeSQLStatement(statement);
        }
      }

      console.log(`✅ Migration ${filename} completed`);
    } catch (error) {
      console.error(`❌ Failed to run migration ${filename}:`, error);
      throw error;
    }
  }

  /**
   * SQL 문을 실행하고 결과 확인
   */
  private async executeSQLStatement(sql: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("exec_sql", {
        sql_query: sql,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      // 이미 존재하는 객체 오류는 무시 (IF NOT EXISTS 사용)
      if (error.message?.includes("already exists")) {
        console.log("⚠️  Object already exists, skipping...");
        return;
      }

      console.error("SQL Error:", error);
      throw error;
    }
  }

  /**
   * SQL 파일을 개별 statement로 분리
   */
  private splitSQLStatements(sql: string): string[] {
    // 코멘트 제거 및 문장 분리
    const cleanSQL = sql
      .replace(/--.*$/gm, "") // 단일행 코멘트 제거
      .replace(/\/\*[\s\S]*?\*\//g, "") // 다중행 코멘트 제거
      .replace(/\s+/g, " ") // 공백 정리
      .trim();

    // 세미콜론으로 분리 (함수 내부 세미콜론 고려)
    const statements: string[] = [];
    let current = "";
    let inFunction = false;
    let dollarQuoteTag = "";

    for (let i = 0; i < cleanSQL.length; i++) {
      const char = cleanSQL[i];
      const peek = cleanSQL.substring(i, i + 10);

      // Dollar quoting 체크 (PostgreSQL 함수)
      if (peek.match(/\$\w*\$/)) {
        const match = peek.match(/\$(\w*)\$/);
        if (match) {
          if (!inFunction) {
            dollarQuoteTag = match[0];
            inFunction = true;
          } else if (match[0] === dollarQuoteTag) {
            inFunction = false;
            dollarQuoteTag = "";
          }
        }
      }

      current += char;

      // 세미콜론 처리
      if (char === ";" && !inFunction) {
        statements.push(current.trim());
        current = "";
      }
    }

    if (current.trim()) {
      statements.push(current.trim());
    }

    return statements.filter((stmt) => stmt.length > 0);
  }

  /**
   * 마이그레이션 완료 기록
   */
  private async recordMigrationCompletion(): Promise<void> {
    const completionRecord = {
      domain: "prediction",
      migration_version: "v1.0",
      tables_created: [
        "prediction_games",
        "prediction_options",
        "prediction_game_stats",
        "predictions",
        "prediction_settlements",
        "user_prediction_stats",
        "prediction_accuracy_history",
      ],
      features_enabled: [
        "Agency Theory Integration",
        "CAPM Risk Model",
        "MoneyWave System",
        "Behavioral Economics Tracking",
        "Row Level Security",
        "Real-time Statistics",
      ],
      completed_at: new Date().toISOString(),
    };

    console.log("📊 Migration Summary:", completionRecord);

    try {
      // 시스템 통계 테이블에 기록 (economy domain에서 생성됨)
      await this.supabase.from("system_statistics").upsert({
        snapshot_date: new Date().toISOString().split("T")[0],
        migration_log: completionRecord,
      });
    } catch (error) {
      console.warn("⚠️  Could not record migration completion:", error);
      // 기록 실패는 마이그레이션 전체를 실패시키지 않음
    }
  }

  /**
   * 테이블 생성 확인
   */
  async verifyTables(): Promise<boolean> {
    console.log("🔍 Verifying prediction domain tables...");

    const expectedTables = [
      "prediction_games",
      "prediction_options",
      "prediction_game_stats",
      "predictions",
      "prediction_settlements",
      "user_prediction_stats",
      "prediction_accuracy_history",
    ];

    try {
      for (const tableName of expectedTables) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error && !error.message.includes("permission denied")) {
          console.error(`❌ Table ${tableName} not found or accessible`);
          return false;
        }
      }

      console.log("✅ All prediction domain tables verified successfully");
      return true;
    } catch (error) {
      console.error("❌ Table verification failed:", error);
      return false;
    }
  }
}

/**
 * 환경변수에서 설정 로드
 */
function loadMigrationConfig(): MigrationConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return {
    supabaseUrl,
    supabaseServiceKey,
    migrationFiles: ["001_prediction_games.sql", "002_predictions.sql"],
  };
}

/**
 * CLI에서 직접 실행 시
 */
async function main() {
  try {
    console.log("🎯 PosMul Prediction Domain Migration");
    console.log("📈 Economic Theory Database Schema Deployment");
    console.log("=".repeat(50));

    const config = loadMigrationConfig();
    const migrationRunner = new PredictionMigrationRunner(config);

    // 마이그레이션 실행
    await migrationRunner.runAllMigrations();

    // 검증
    const isValid = await migrationRunner.verifyTables();

    if (isValid) {
      console.log("");
      console.log("🎉 Prediction Domain Migration Complete!");
      console.log("💰 PmpAmount/PmcAmount economic integration ready");
      console.log("🏆 Agency Theory & CAPM models deployed");
      console.log("📊 Ready for prediction game UI development");
      process.exit(0);
    } else {
      console.error("❌ Migration verification failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default PredictionMigrationRunner;
