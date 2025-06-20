/**
 * Supabase MoneyWave History Repository Implementation
 *
 * MoneyWave 1-2-3 시스템의 실행 이력 및 효과성 분석을 위한 Repository 구현체
 * IMoneyWaveHistoryRepository 인터페이스를 Supabase로 구현
 */

import { Result } from "../../../../shared/types/common";
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
  createEBIT,
  createPMC,
  PMC,
  unwrapEBIT,
  unwrapPMC,
} from "../../domain/value-objects";
import { BaseSupabaseRepository } from "./base-supabase.repository";

/**
 * Supabase 기반 MoneyWave History Repository 구현
 */
export class SupabaseMoneyWaveHistoryRepository
  extends BaseSupabaseRepository
  implements IMoneyWaveHistoryRepository
{
  /**
   * MoneyWave1 실행 기록 저장
   */
  async saveMoneyWave1Record(
    record: Omit<MoneyWave1Record, "recordId">
  ): Promise<Result<MoneyWave1Record>> {
    try {
      const { data, error } = await this.client
        .from("money_wave_events")
        .insert({
          wave_type: "WAVE1",
          event_data: {
            companyId: record.companyId,
            executionDate: record.executionDate.toISOString(),
            ebitAmount: unwrapEBIT(record.ebitAmount),
            pmcIssued: unwrapPMC(record.pmcIssued),
            conversionRate: record.conversionRate,
            stakeholderCount: record.stakeholderCount,
            economicImpact: record.economicImpact,
            socialWelfare: record.socialWelfare,
          },
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const savedRecord: MoneyWave1Record = {
        recordId: data.id,
        companyId: data.event_data.companyId,
        executionDate: new Date(data.event_data.executionDate),
        ebitAmount: createEBIT(data.event_data.ebitAmount),
        pmcIssued: createPMC(data.event_data.pmcIssued),
        conversionRate: data.event_data.conversionRate,
        stakeholderCount: data.event_data.stakeholderCount,
        economicImpact: data.event_data.economicImpact,
        socialWelfare: data.event_data.socialWelfare,
      };

      return this.handleSuccess(savedRecord);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * MoneyWave2 실행 기록 저장
   */
  async saveMoneyWave2Record(
    record: Omit<MoneyWave2Record, "recordId">
  ): Promise<Result<MoneyWave2Record>> {
    try {
      const { data, error } = await this.client
        .from("money_wave_events")
        .insert({
          wave_type: "WAVE2",
          event_data: {
            executionDate: record.executionDate.toISOString(),
            eligibilitySnapshot: record.eligibilitySnapshot,
            redistributionResults: record.redistributionResults,
            pigouEfficiency: record.pigouEfficiency,
            rawlsianJustice: record.rawlsianJustice,
          },
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const savedRecord: MoneyWave2Record = {
        recordId: data.id,
        executionDate: new Date(data.event_data.executionDate),
        eligibilitySnapshot: data.event_data.eligibilitySnapshot,
        redistributionResults: data.event_data.redistributionResults,
        pigouEfficiency: data.event_data.pigouEfficiency,
        rawlsianJustice: data.event_data.rawlsianJustice,
      };

      return this.handleSuccess(savedRecord);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * MoneyWave3 실행 기록 저장
   */
  async saveMoneyWave3Record(
    record: Omit<MoneyWave3Record, "recordId">
  ): Promise<Result<MoneyWave3Record>> {
    try {
      const { data, error } = await this.client
        .from("money_wave_events")
        .insert({
          wave_type: "WAVE3",
          event_data: {
            executionDate: record.executionDate.toISOString(),
            entrepreneurialActivity: record.entrepreneurialActivity,
            resourceAllocation: record.resourceAllocation,
            schumpeterianImpact: record.schumpeterianImpact,
            kirznerianDiscovery: record.kirznerianDiscovery,
          },
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const savedRecord: MoneyWave3Record = {
        recordId: data.id,
        executionDate: new Date(data.event_data.executionDate),
        entrepreneurialActivity: data.event_data.entrepreneurialActivity,
        resourceAllocation: data.event_data.resourceAllocation,
        schumpeterianImpact: data.event_data.schumpeterianImpact,
        kirznerianDiscovery: data.event_data.kirznerianDiscovery,
      };

      return this.handleSuccess(savedRecord);
    } catch (error) {
      return this.handleError(error);
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
      let query = this.client
        .from("money_wave_events")
        .select("*")
        .eq("wave_type", this.mapWaveType(moneyWaveType));

      if (startDate) {
        query = query.gte("processed_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("processed_at", endDate.toISOString());
      }
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query.order("processed_at", {
        ascending: false,
      });

      if (error) {
        return this.handleError(error);
      }

      const records = data.map((row) => this.mapToRecord(row, moneyWaveType));
      return this.handleSuccess(records);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 특정 MoneyWave 기록 조회
   */
  async getMoneyWaveRecordById(
    recordId: string
  ): Promise<Result<MoneyWave1Record | MoneyWave2Record | MoneyWave3Record>> {
    try {
      const { data, error } = await this.client
        .from("money_wave_events")
        .select("*")
        .eq("id", recordId)
        .single();

      if (error) {
        return this.handleError(error);
      }

      const moneyWaveType = this.mapDbWaveType(data.wave_type);
      const record = this.mapToRecord(data, moneyWaveType);
      return this.handleSuccess(record);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * MoneyWave 통계 조회
   */
  async getMoneyWaveStatistics(
    moneyWaveType: MoneyWaveType
  ): Promise<Result<MoneyWaveStatistics>> {
    try {
      const { data, error } = await this.client
        .from("money_wave_events")
        .select("*")
        .eq("wave_type", this.mapWaveType(moneyWaveType));

      if (error) {
        return this.handleError(error);
      }

      const totalExecutions = data.length;
      const totalPMCImpact = this.calculateTotalPMCImpact(data, moneyWaveType);
      const lastExecutionDate =
        data.length > 0
          ? new Date(
              Math.max(...data.map((d) => new Date(d.processed_at).getTime()))
            )
          : new Date();

      const statistics: MoneyWaveStatistics = {
        moneyWaveType,
        totalExecutions,
        totalPMCImpact,
        averageSuccessRate: 0.85, // 실제 계산 로직 필요
        economicEfficiency: 0.78, // 실제 계산 로직 필요
        socialWelfareChange: 0.12, // 실제 계산 로직 필요
        lastExecutionDate,
      };

      return this.handleSuccess(statistics);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 전체 MoneyWave 통계 조회
   */
  async getAllMoneyWaveStatistics(): Promise<Result<MoneyWaveStatistics[]>> {
    try {
      const moneyWaveTypes: MoneyWaveType[] = [
        "MONEY_WAVE_1",
        "MONEY_WAVE_2",
        "MONEY_WAVE_3",
      ];
      const allStatistics: MoneyWaveStatistics[] = [];

      for (const waveType of moneyWaveTypes) {
        const result = await this.getMoneyWaveStatistics(waveType);
        if (result.success) {
          allStatistics.push(result.data);
        }
      }

      return this.handleSuccess(allStatistics);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * MoneyWave 효과성 분석 저장
   */
  async saveEffectivenessAnalysis(
    analysis: Omit<MoneyWaveEffectiveness, "recordId">
  ): Promise<Result<MoneyWaveEffectiveness>> {
    try {
      const { data, error } = await this.client
        .from("money_wave_effectiveness")
        .insert({
          wave_type: this.mapWaveType(analysis.moneyWaveType),
          start_date: analysis.effectivenessPeriod.startDate.toISOString(),
          end_date: analysis.effectivenessPeriod.endDate.toISOString(),
          macroeconomic_impact: analysis.macroeconomicImpact,
          microeconomic_impact: analysis.microeconomicImpact,
          institutional_impact: analysis.institutionalImpact,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const savedAnalysis: MoneyWaveEffectiveness = {
        recordId: data.id,
        moneyWaveType: this.mapDbWaveType(data.wave_type),
        effectivenessPeriod: {
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
        },
        macroeconomicImpact: data.macroeconomic_impact,
        microeconomicImpact: data.microeconomic_impact,
        institutionalImpact: data.institutional_impact,
      };

      return this.handleSuccess(savedAnalysis);
    } catch (error) {
      return this.handleError(error);
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
      let query = this.client
        .from("money_wave_effectiveness")
        .select("*")
        .eq("wave_type", this.mapWaveType(moneyWaveType));

      if (startDate) {
        query = query.gte("start_date", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("end_date", endDate.toISOString());
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        return this.handleError(error);
      }

      const analyses: MoneyWaveEffectiveness[] = data.map((row) => ({
        recordId: row.id,
        moneyWaveType: this.mapDbWaveType(row.wave_type),
        effectivenessPeriod: {
          startDate: new Date(row.start_date),
          endDate: new Date(row.end_date),
        },
        macroeconomicImpact: row.macroeconomic_impact,
        microeconomicImpact: row.microeconomic_impact,
        institutionalImpact: row.institutional_impact,
      }));

      return this.handleSuccess(analyses);
    } catch (error) {
      return this.handleError(error);
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
        totalPMCImpact: PMC;
      }[]
    >
  > {
    try {
      const { data, error } = await this.client
        .from("money_wave_events")
        .select("*")
        .eq("wave_type", this.mapWaveType(moneyWaveType))
        .gte("processed_at", startDate.toISOString())
        .lte("processed_at", endDate.toISOString())
        .order("processed_at", { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      const groupedData = this.groupByPeriod(data, periodType);
      const frequencyData = Object.entries(groupedData).map(
        ([period, events]) => ({
          period,
          executionCount: events.length,
          totalPMCImpact: this.calculateTotalPMCImpact(events, moneyWaveType),
        })
      );

      return this.handleSuccess(frequencyData);
    } catch (error) {
      return this.handleError(error);
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
      // 실제 상관관계 계산 로직 필요
      // 현재는 더미 데이터 반환
      const correlations = {
        wave1_wave2_correlation: 0.65,
        wave1_wave3_correlation: 0.42,
        wave2_wave3_correlation: 0.38,
        combinedEffectiveness: 0.78,
      };

      return this.handleSuccess(correlations);
    } catch (error) {
      return this.handleError(error);
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
      const { data, error } = await this.client
        .from("money_wave_events")
        .select("*")
        .eq("wave_type", this.mapWaveType(moneyWaveType))
        .gte("processed_at", startDate.toISOString())
        .lte("processed_at", endDate.toISOString())
        .order("processed_at", { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      const timeSeriesData = this.aggregateByGranularity(
        data,
        metrics,
        granularity
      );
      return this.handleSuccess(timeSeriesData);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper methods
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
          pmcIssued: createPMC(row.event_data.pmcIssued),
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
        throw new Error(`Unknown MoneyWave type: ${moneyWaveType}`);
    }
  }

  private calculateTotalPMCImpact(
    data: any[],
    moneyWaveType: MoneyWaveType
  ): PMC {
    // 실제 계산 로직 구현 필요
    let total = 0;

    data.forEach((row) => {
      switch (moneyWaveType) {
        case "MONEY_WAVE_1":
          total += row.event_data.pmcIssued || 0;
          break;
        case "MONEY_WAVE_2":
          total +=
            row.event_data.redistributionResults?.redistributedAmount || 0;
          break;
        case "MONEY_WAVE_3":
          total += row.event_data.resourceAllocation?.totalPMCAllocated || 0;
          break;
      }
    });

    return createPMC(total);
  }

  private groupByPeriod(
    data: any[],
    periodType: string
  ): Record<string, any[]> {
    // 실제 그룹핑 로직 구현 필요
    const grouped: Record<string, any[]> = {};

    data.forEach((item) => {
      const date = new Date(item.processed_at);
      let periodKey: string;

      switch (periodType) {
        case "daily":
          periodKey = date.toISOString().split("T")[0];
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split("T")[0];
          break;
        case "monthly":
          periodKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          break;
        case "quarterly":
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          periodKey = date.toISOString().split("T")[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(item);
    });

    return grouped;
  }

  private aggregateByGranularity(
    data: any[],
    metrics: string[],
    granularity: string
  ): { timestamp: Date; values: Record<string, number> }[] {
    // 실제 집계 로직 구현 필요
    const aggregated: { timestamp: Date; values: Record<string, number> }[] =
      [];

    // 더미 구현 - 실제로는 요청된 metrics에 따라 데이터를 집계해야 함
    data.forEach((item) => {
      const values: Record<string, number> = {};
      metrics.forEach((metric) => {
        values[metric] = Math.random() * 100; // 실제 계산 로직 필요
      });

      aggregated.push({
        timestamp: new Date(item.processed_at),
        values,
      });
    });

    return aggregated;
  }
}
