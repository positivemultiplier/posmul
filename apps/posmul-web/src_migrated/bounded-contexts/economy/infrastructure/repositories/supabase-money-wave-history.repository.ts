/**
 * Supabase MoneyWave History Repository Implementation (MCP Pattern)
 *
 * MoneyWave 1-2-3 시스템의 실행 이력 및 효과성 분석을 위한 Repository 구현체
 * IMoneyWaveHistoryRepository 인터페이스를 MCP 패턴으로 구현
 */

import {
  Result,
  failure,
  success,
} from "../../../../../src/shared/types/common";
import {
  IMoneyWaveHistoryRepository,
  MoneyWave1Record,
  MoneyWave2Record,
  MoneyWave3Record,
  MoneyWaveEffectiveness,
  MoneyWaveStatistics,
  MoneyWaveType,
} from "../../domain/repositories/money-wave-history.repository";
import {
  PmcAmount,
  createEBIT,
  createPmcAmount,
  unwrapEBIT,
  unwrapPmcAmount,
} from "../../domain/value-objects";
import { BaseMCPRepository } from "./base-mcp.repository";

/**
 * MCP 기반 MoneyWave History Repository 구현
 */
export class SupabaseMoneyWaveHistoryRepository
  extends BaseMCPRepository
  implements IMoneyWaveHistoryRepository
{
  /**
   * MoneyWave1 실행 기록 저장
   */
  async saveMoneyWave1Record(
    record: Omit<MoneyWave1Record, "recordId">
  ): Promise<Result<MoneyWave1Record>> {
    try {
      const query = `
        INSERT INTO money_wave_events (
          wave_type, event_data, processed_at
        ) VALUES (
          $1, $2, $3
        ) RETURNING id, wave_type, event_data, processed_at;
      `;

      const eventData = {
        companyId: record.companyId,
        executionDate: record.executionDate.toISOString(),
        ebitAmount: unwrapEBIT(record.ebitAmount),
        pmcIssued: unwrapPmcAmount(record.pmcIssued),
        conversionRate: record.conversionRate,
        stakeholderCount: record.stakeholderCount,
        economicImpact: record.economicImpact,
        socialWelfare: record.socialWelfare,
      };

      const result = await this.executeQuery(query, [
        "WAVE1",
        JSON.stringify(eventData),
        new Date().toISOString(),
      ]);

      if (!result.success || !result.data?.length) {
        return failure(new Error("Failed to save MoneyWave1 record"));
      }

      const data = result.data[0];
      const savedRecord: MoneyWave1Record = {
        recordId: data.id,
        companyId: data.event_data.companyId,
        executionDate: new Date(data.event_data.executionDate),
        ebitAmount: createEBIT(data.event_data.ebitAmount),
        pmcIssued: createPmcAmount(data.event_data.pmcIssued),
        conversionRate: data.event_data.conversionRate,
        stakeholderCount: data.event_data.stakeholderCount,
        economicImpact: data.event_data.economicImpact,
        socialWelfare: data.event_data.socialWelfare,
      };

      return success(savedRecord);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave2 실행 기록 저장
   */
  async saveMoneyWave2Record(
    record: Omit<MoneyWave2Record, "recordId">
  ): Promise<Result<MoneyWave2Record>> {
    try {
      const query = `
        INSERT INTO money_wave_events (
          wave_type, event_data, processed_at
        ) VALUES (
          $1, $2, $3
        ) RETURNING id, wave_type, event_data, processed_at;
      `;

      const eventData = {
        executionDate: record.executionDate.toISOString(),
        eligibilitySnapshot: record.eligibilitySnapshot,
        redistributionResults: record.redistributionResults,
        pigouEfficiency: record.pigouEfficiency,
        rawlsianJustice: record.rawlsianJustice,
      };

      const result = await this.executeQuery(query, [
        "WAVE2",
        JSON.stringify(eventData),
        new Date().toISOString(),
      ]);

      if (!result.success || !result.data?.length) {
        return failure(new Error("Failed to save MoneyWave2 record"));
      }

      const data = result.data[0];
      const savedRecord: MoneyWave2Record = {
        recordId: data.id,
        executionDate: new Date(data.event_data.executionDate),
        eligibilitySnapshot: data.event_data.eligibilitySnapshot,
        redistributionResults: data.event_data.redistributionResults,
        pigouEfficiency: data.event_data.pigouEfficiency,
        rawlsianJustice: data.event_data.rawlsianJustice,
      };

      return success(savedRecord);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave3 실행 기록 저장
   */
  async saveMoneyWave3Record(
    record: Omit<MoneyWave3Record, "recordId">
  ): Promise<Result<MoneyWave3Record>> {
    try {
      const query = `
        INSERT INTO money_wave_events (
          wave_type, event_data, processed_at
        ) VALUES (
          $1, $2, $3
        ) RETURNING id, wave_type, event_data, processed_at;
      `;

      const eventData = {
        executionDate: record.executionDate.toISOString(),
        entrepreneurialActivity: record.entrepreneurialActivity,
        resourceAllocation: record.resourceAllocation,
        schumpeterianImpact: record.schumpeterianImpact,
        kirznerianDiscovery: record.kirznerianDiscovery,
      };

      const result = await this.executeQuery(query, [
        "WAVE3",
        JSON.stringify(eventData),
        new Date().toISOString(),
      ]);

      if (!result.success || !result.data?.length) {
        return failure(new Error("Failed to save MoneyWave3 record"));
      }

      const data = result.data[0];
      const savedRecord: MoneyWave3Record = {
        recordId: data.id,
        executionDate: new Date(data.event_data.executionDate),
        entrepreneurialActivity: data.event_data.entrepreneurialActivity,
        resourceAllocation: data.event_data.resourceAllocation,
        schumpeterianImpact: data.event_data.schumpeterianImpact,
        kirznerianDiscovery: data.event_data.kirznerianDiscovery,
      };

      return success(savedRecord);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave 실행 기록 조회 (타입별)
   */
  async getMoneyWaveRecords(
    moneyWaveType: MoneyWaveType,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  ): Promise<
    Result<(MoneyWave1Record | MoneyWave2Record | MoneyWave3Record)[]>
  > {
    try {
      let query = `
        SELECT id, wave_type, event_data, processed_at
        FROM money_wave_events
        WHERE wave_type = $1
      `;
      const params: any[] = [this.mapWaveType(moneyWaveType)];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND processed_at >= $${paramIndex}`;
        params.push(startDate.toISOString());
        paramIndex++;
      }
      if (endDate) {
        query += ` AND processed_at <= $${paramIndex}`;
        params.push(endDate.toISOString());
        paramIndex++;
      }

      query += ` ORDER BY processed_at DESC`;

      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
      }
      if (offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const result = await this.executeQuery(query, params);

      if (!result.success) {
        return failure(new Error("Failed to get MoneyWave records"));
      }

      const records =
        result.data?.map((row: any) => this.mapToRecord(row, moneyWaveType)) ||
        [];

      return success(records);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * 특정 MoneyWave 기록 조회
   */
  async getMoneyWaveRecordById(
    recordId: string
  ): Promise<Result<MoneyWave1Record | MoneyWave2Record | MoneyWave3Record>> {
    try {
      const query = `
        SELECT id, wave_type, event_data, processed_at
        FROM money_wave_events
        WHERE id = $1;
      `;

      const result = await this.executeQuery(query, [recordId]);

      if (!result.success || !result.data?.length) {
        return failure(new Error("MoneyWave record not found"));
      }

      const row = result.data[0];
      const moneyWaveType = this.mapDbWaveType(row.wave_type);
      const record = this.mapToRecord(row, moneyWaveType);

      return success(record);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave 통계 조회
   */
  async getMoneyWaveStatistics(
    moneyWaveType: MoneyWaveType
  ): Promise<Result<MoneyWaveStatistics>> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_executions,
          MAX(processed_at) as last_execution_date,
          AVG(CASE
            WHEN event_data->>'successRate' IS NOT NULL
            THEN (event_data->>'successRate')::numeric
            ELSE 0.8
          END) as average_success_rate
        FROM money_wave_events
        WHERE wave_type = $1;
      `;

      const result = await this.executeQuery(query, [
        this.mapWaveType(moneyWaveType),
      ]);

      if (!result.success || !result.data?.length) {
        return failure(new Error("Failed to get MoneyWave statistics"));
      }

      const row = result.data[0];
      const statistics: MoneyWaveStatistics = {
        moneyWaveType,
        totalExecutions: parseInt(row.total_executions) || 0,
        totalPmcAmountImpact: createPmcAmount(0), // TODO: Calculate from actual data
        averageSuccessRate: parseFloat(row.average_success_rate) || 0,
        economicEfficiency: 0.85, // TODO: Calculate from actual data
        socialWelfareChange: 0.12, // TODO: Calculate from actual data
        lastExecutionDate: row.last_execution_date
          ? new Date(row.last_execution_date)
          : new Date(),
      };

      return success(statistics);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * 전체 MoneyWave 통계 조회
   */
  async getAllMoneyWaveStatistics(): Promise<Result<MoneyWaveStatistics[]>> {
    try {
      const waveTypes: MoneyWaveType[] = [
        "MONEY_WAVE_1",
        "MONEY_WAVE_2",
        "MONEY_WAVE_3",
      ];
      const statisticsResults = await Promise.all(
        waveTypes.map((type) => this.getMoneyWaveStatistics(type))
      );

      const statistics: MoneyWaveStatistics[] = [];
      for (const result of statisticsResults) {
        if (result.success) {
          statistics.push(result.data);
        }
      }

      return success(statistics);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave 효과성 분석 저장
   */
  async saveEffectivenessAnalysis(
    analysis: Omit<MoneyWaveEffectiveness, "recordId">
  ): Promise<Result<MoneyWaveEffectiveness>> {
    try {
      const query = `
        INSERT INTO money_wave_effectiveness (
          wave_type, effectiveness_period_start, effectiveness_period_end,
          macroeconomic_impact, microeconomic_impact, institutional_impact
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING id, wave_type, effectiveness_period_start, effectiveness_period_end,
                   macroeconomic_impact, microeconomic_impact, institutional_impact;
      `;

      const result = await this.executeQuery(query, [
        this.mapWaveType(analysis.moneyWaveType),
        analysis.effectivenessPeriod.startDate.toISOString(),
        analysis.effectivenessPeriod.endDate.toISOString(),
        JSON.stringify(analysis.macroeconomicImpact),
        JSON.stringify(analysis.microeconomicImpact),
        JSON.stringify(analysis.institutionalImpact),
      ]);

      if (!result.success || !result.data?.length) {
        return failure(new Error("Failed to save effectiveness analysis"));
      }

      const data = result.data[0];
      const savedAnalysis: MoneyWaveEffectiveness = {
        recordId: data.id,
        moneyWaveType: this.mapDbWaveType(data.wave_type),
        effectivenessPeriod: {
          startDate: new Date(data.effectiveness_period_start),
          endDate: new Date(data.effectiveness_period_end),
        },
        macroeconomicImpact: data.macroeconomic_impact,
        microeconomicImpact: data.microeconomic_impact,
        institutionalImpact: data.institutional_impact,
      };

      return success(savedAnalysis);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave 효과성 분석 조회
   */
  async getEffectivenessAnalysis(
    moneyWaveType: MoneyWaveType,
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<MoneyWaveEffectiveness[]>> {
    try {
      let query = `
        SELECT id, wave_type, effectiveness_period_start, effectiveness_period_end,
               macroeconomic_impact, microeconomic_impact, institutional_impact
        FROM money_wave_effectiveness
        WHERE wave_type = $1
      `;
      const params: any[] = [this.mapWaveType(moneyWaveType)];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND effectiveness_period_start >= $${paramIndex}`;
        params.push(startDate.toISOString());
        paramIndex++;
      }
      if (endDate) {
        query += ` AND effectiveness_period_end <= $${paramIndex}`;
        params.push(endDate.toISOString());
      }

      query += ` ORDER BY effectiveness_period_start DESC`;

      const result = await this.executeQuery(query, params);

      if (!result.success) {
        return failure(new Error("Failed to get effectiveness analysis"));
      }

      const analyses =
        result.data?.map(
          (row: any): MoneyWaveEffectiveness => ({
            recordId: row.id,
            moneyWaveType: this.mapDbWaveType(row.wave_type),
            effectivenessPeriod: {
              startDate: new Date(row.effectiveness_period_start),
              endDate: new Date(row.effectiveness_period_end),
            },
            macroeconomicImpact: row.macroeconomic_impact,
            microeconomicImpact: row.microeconomic_impact,
            institutionalImpact: row.institutional_impact,
          })
        ) || [];

      return success(analyses);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * 기간별 MoneyWave 실행 횟수 조회
   */
  async getExecutionFrequency(
    moneyWaveType: MoneyWaveType,
    periodType: "daily" | "weekly" | "monthly" | "quarterly",
    startDate: Date,
    endDate: Date
  ): Promise<
    Result<
      {
        period: string;
        executionCount: number;
        totalPmcAmountImpact: PmcAmount;
      }[]
    >
  > {
    try {
      const dateFormat = this.getDateTruncFormat(periodType);
      const query = `
        SELECT
          DATE_TRUNC('${dateFormat}', processed_at) as period,
          COUNT(*) as execution_count,
          COALESCE(SUM(
            CASE
              WHEN event_data->>'pmcIssued' IS NOT NULL
              THEN (event_data->>'pmcIssued')::numeric
              ELSE 0
            END
          ), 0) as total_pmc_impact
        FROM money_wave_events
        WHERE wave_type = $1
          AND processed_at >= $2
          AND processed_at <= $3
        GROUP BY DATE_TRUNC('${dateFormat}', processed_at)
        ORDER BY period;
      `;

      const result = await this.executeQuery(query, [
        this.mapWaveType(moneyWaveType),
        startDate.toISOString(),
        endDate.toISOString(),
      ]);

      if (!result.success) {
        return failure(new Error("Failed to get execution frequency"));
      }

      const frequencies =
        result.data?.map((row: any) => ({
          period: row.period,
          executionCount: parseInt(row.execution_count) || 0,
          totalPmcAmountImpact: createPmcAmount(
            parseFloat(row.total_pmc_impact) || 0
          ),
        })) || [];

      return success(frequencies);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave 간 상관관계 분석 데이터 조회
   */
  async getMoneyWaveCorrelations(): Promise<
    Result<{
      wave1_wave2_correlation: number;
      wave1_wave3_correlation: number;
      wave2_wave3_correlation: number;
      combinedEffectiveness: number;
    }>
  > {
    try {
      // 복잡한 상관관계 계산을 위한 임시 구현
      // 실제 구현에서는 통계 함수를 사용해야 함
      const query = `
        SELECT
          COUNT(*) FILTER (WHERE wave_type = 'WAVE1') as wave1_count,
          COUNT(*) FILTER (WHERE wave_type = 'WAVE2') as wave2_count,
          COUNT(*) FILTER (WHERE wave_type = 'WAVE3') as wave3_count,
          AVG(CASE WHEN wave_type = 'WAVE1' THEN 1 ELSE 0 END) as wave1_avg,
          AVG(CASE WHEN wave_type = 'WAVE2' THEN 1 ELSE 0 END) as wave2_avg,
          AVG(CASE WHEN wave_type = 'WAVE3' THEN 1 ELSE 0 END) as wave3_avg
        FROM money_wave_events
        WHERE processed_at >= NOW() - INTERVAL '1 year';
      `;

      const result = await this.executeQuery(query);

      if (!result.success || !result.data?.length) {
        return failure(new Error("Failed to get MoneyWave correlations"));
      }

      // 임시 상관관계 값 (실제로는 복잡한 통계 계산 필요)
      const correlations = {
        wave1_wave2_correlation: 0.65,
        wave1_wave3_correlation: 0.45,
        wave2_wave3_correlation: 0.72,
        combinedEffectiveness: 0.83,
      };

      return success(correlations);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * 장기 트렌드 분석을 위한 시계열 데이터 조회
   */
  async getTimeSeriesData(
    moneyWaveType: MoneyWaveType,
    metrics: string[],
    startDate: Date,
    endDate: Date,
    granularity: "hour" | "day" | "week" | "month"
  ): Promise<
    Result<
      {
        timestamp: Date;
        values: Record<string, number>;
      }[]
    >
  > {
    try {
      const dateFormat = this.getDateTruncFormat(granularity);
      const query = `
        SELECT
          DATE_TRUNC('${dateFormat}', processed_at) as timestamp,
          COUNT(*) as execution_count,
          AVG(COALESCE((event_data->>'successRate')::numeric, 0.8)) as avg_success_rate,
          SUM(COALESCE((event_data->>'pmcIssued')::numeric, 0)) as total_pmc_issued
        FROM money_wave_events
        WHERE wave_type = $1
          AND processed_at >= $2
          AND processed_at <= $3
        GROUP BY DATE_TRUNC('${dateFormat}', processed_at)
        ORDER BY timestamp;
      `;

      const result = await this.executeQuery(query, [
        this.mapWaveType(moneyWaveType),
        startDate.toISOString(),
        endDate.toISOString(),
      ]);

      if (!result.success) {
        return failure(new Error("Failed to get time series data"));
      }

      const timeSeriesData =
        result.data?.map((row: any) => ({
          timestamp: new Date(row.timestamp),
          values: {
            execution_count: parseInt(row.execution_count) || 0,
            avg_success_rate: parseFloat(row.avg_success_rate) || 0,
            total_pmc_issued: parseFloat(row.total_pmc_issued) || 0,
          },
        })) || [];

      return success(timeSeriesData);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * MoneyWave 타입을 DB 값으로 매핑
   */
  private mapWaveType(moneyWaveType: MoneyWaveType): string {
    switch (moneyWaveType) {
      case "MONEY_WAVE_1":
        return "WAVE1";
      case "MONEY_WAVE_2":
        return "WAVE2";
      case "MONEY_WAVE_3":
        return "WAVE3";
      default:
        return "WAVE1";
    }
  }

  /**
   * DB 값을 MoneyWave 타입으로 매핑
   */
  private mapDbWaveType(dbWaveType: string): MoneyWaveType {
    switch (dbWaveType) {
      case "WAVE1":
        return "MONEY_WAVE_1";
      case "WAVE2":
        return "MONEY_WAVE_2";
      case "WAVE3":
        return "MONEY_WAVE_3";
      default:
        return "MONEY_WAVE_1";
    }
  }

  /**
   * DB 행을 도메인 객체로 매핑
   */
  private mapToRecord(
    row: any,
    moneyWaveType: MoneyWaveType
  ): MoneyWave1Record | MoneyWave2Record | MoneyWave3Record {
    switch (moneyWaveType) {
      case "MONEY_WAVE_1":
        return {
          recordId: row.id,
          companyId: row.event_data.companyId,
          executionDate: new Date(row.event_data.executionDate),
          ebitAmount: createEBIT(row.event_data.ebitAmount),
          pmcIssued: createPmcAmount(row.event_data.pmcIssued),
          conversionRate: row.event_data.conversionRate,
          stakeholderCount: row.event_data.stakeholderCount,
          economicImpact: row.event_data.economicImpact,
          socialWelfare: row.event_data.socialWelfare,
        } as MoneyWave1Record;

      case "MONEY_WAVE_2":
        return {
          recordId: row.id,
          executionDate: new Date(row.event_data.executionDate),
          eligibilitySnapshot: row.event_data.eligibilitySnapshot,
          redistributionResults: row.event_data.redistributionResults,
          pigouEfficiency: row.event_data.pigouEfficiency,
          rawlsianJustice: row.event_data.rawlsianJustice,
        } as MoneyWave2Record;

      case "MONEY_WAVE_3":
        return {
          recordId: row.id,
          executionDate: new Date(row.event_data.executionDate),
          entrepreneurialActivity: row.event_data.entrepreneurialActivity,
          resourceAllocation: row.event_data.resourceAllocation,
          schumpeterianImpact: row.event_data.schumpeterianImpact,
          kirznerianDiscovery: row.event_data.kirznerianDiscovery,
        } as MoneyWave3Record;

      default:
        throw new Error(`Unsupported MoneyWave type: ${moneyWaveType}`);
    }
  }

  /**
   * 기간 타입에 따른 DATE_TRUNC 형식 반환
   */
  private getDateTruncFormat(periodType: string): string {
    switch (periodType) {
      case "hour":
      case "hourly":
        return "hour";
      case "day":
      case "daily":
        return "day";
      case "week":
      case "weekly":
        return "week";
      case "month":
      case "monthly":
        return "month";
      case "quarter":
      case "quarterly":
        return "quarter";
      default:
        return "day";
    }
  }
}
