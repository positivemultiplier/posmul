/**
 * 마스터 게임 스케줄러 서비스
 *
 * 모든 데이터 소스를 통합하여 정기 예측 게임을 자동 생성 및 동기화
 * - 한국은행 ECOS: 기준금리, 실질 GDP, 경상수지
 * - 통계청 KOSIS: 소비자물가지수(CPI), 실업률
 * - 금융감독원 DART: 국내 시총 상위 상장사 분기 실적
 * - K-콘텐츠 (KOBIS/시청률/음원): 주말 박스오피스, 주말 드라마 시청률, 일요 예능, K-POP 차트
 * - Football Data: 유럽 축구 6대 리그
 * - FMP Earnings: 미국 빅테크 분기 실적 발표
 */

import { balancedBriefingService } from "./balanced-briefing.service";
import { CreatePredictionGameUseCase } from "../use-cases/create-prediction-game.use-case";
import { EarningsCalendarSchedulerService } from "./earnings-calendar-scheduler.service";
import { FootballMatchSchedulerService } from "./football-match-scheduler.service";
import {
  GameSchedulingService,
  ScheduledGameTemplate,
} from "./game-scheduling.service";

export interface MasterSchedulerConfig {
  enableFootball: boolean;
  enableEarnings: boolean;
  enableDynamicGames: boolean;
  syncIntervalMinutes: number;
}

export class MasterGameSchedulerService {
  private readonly gameScheduler: GameSchedulingService;
  private footballScheduler: FootballMatchSchedulerService | null = null;
  private earningsScheduler: EarningsCalendarSchedulerService | null = null;
  private config: MasterSchedulerConfig;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    createGameUseCase: CreatePredictionGameUseCase,
    config?: Partial<MasterSchedulerConfig>
  ) {
    this.config = {
      enableFootball: true,
      enableEarnings: true,
      enableDynamicGames: true,
      syncIntervalMinutes: 60,
      ...config,
    };

    this.gameScheduler = new GameSchedulingService(createGameUseCase);

    try {
      if (this.config.enableFootball && process.env.FOOTBALL_DATA_API_KEY) {
        this.footballScheduler = new FootballMatchSchedulerService();
      }
    } catch {
      this.footballScheduler = null;
    }

    try {
      if (this.config.enableEarnings && process.env.FMP_API_KEY) {
        this.earningsScheduler = new EarningsCalendarSchedulerService();
      }
    } catch {
      this.earningsScheduler = null;
    }
  }

  async start(): Promise<void> {
    await this.syncAllSources();
    await this.gameScheduler.startScheduling();

    this.syncInterval = setInterval(
      () => this.syncAllSources(),
      this.config.syncIntervalMinutes * 60 * 1000
    );
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.gameScheduler.stopScheduling();
  }

  /**
   * 모든 외부 캘린더 소스(축구 경기 + 미국 실적 발표) 동기화
   */
  async syncAllSources(): Promise<{
    footballAdded: number;
    earningsAdded: number;
    totalTemplates: number;
  }> {
    let footballAdded = 0;
    let earningsAdded = 0;
    const newTemplates: ScheduledGameTemplate[] = [];

    if (this.footballScheduler) {
      try {
        const footballTemplates =
          await this.footballScheduler.generateWeeklyGameTemplates();
        newTemplates.push(...footballTemplates);
        footballAdded = footballTemplates.length;
      } catch {
        // Ignore API failure during sync
      }
    }

    if (this.earningsScheduler) {
      try {
        const earningsTemplates =
          await this.earningsScheduler.generateWeeklyEarningsGames();
        newTemplates.push(...earningsTemplates);
        earningsAdded = earningsTemplates.length;
      } catch {
        // Ignore API failure during sync
      }
    }

    for (const template of newTemplates) {
      const existing = this.gameScheduler
        .getActiveTemplates()
        .find((t) => t.id === template.id);

      if (!existing) {
        this.gameScheduler.addTemplate(template);
      }
    }

    return {
      footballAdded,
      earningsAdded,
      totalTemplates: this.gameScheduler.getActiveTemplates().length,
    };
  }

  /**
   * 수동 동기화 트리거 및 지정 카테고리 템플릿 즉시 발행
   */
  async triggerSync(options?: {
    materializeTemplates?: boolean;
    category?: string;
  }): Promise<{
    footballAdded: number;
    earningsAdded: number;
    totalTemplates: number;
    createdGameIds: string[];
  }> {
    const syncStats = await this.syncAllSources();
    const createdGameIds: string[] = [];

    if (options?.materializeTemplates) {
      const targetTemplates = options.category
        ? this.getTemplatesByCategory(options.category)
        : this.getActiveTemplates();

      for (const template of targetTemplates) {
        const createdId =
          await this.gameScheduler.createGameFromTemplate(template);
        if (createdId) {
          createdGameIds.push(createdId);
        }
      }
    }

    // 신규 생성된 게임들의 AI 균형 의사결정 브리핑을 4개씩 병렬 배치로 사전 생성 (베스트에포트)
    if (createdGameIds.length > 0) {
      const batchSize = 4;
      for (let i = 0; i < createdGameIds.length; i += batchSize) {
        const batch = createdGameIds.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((gameId) =>
            balancedBriefingService.getOrCreateForGameId(gameId, {
              timeoutMs: 12000,
            }),
          ),
        );
      }
    }

    return {
      ...syncStats,
      createdGameIds,
    };
  }

  getStatus() {
    const activeTemplates = this.gameScheduler.getActiveTemplates();
    return {
      isRunning: this.syncInterval !== null,
      config: this.config,
      schedulingStats: this.gameScheduler.getSchedulingStats(),
      footballEnabled: this.footballScheduler !== null,
      earningsEnabled: this.earningsScheduler !== null,
      templatesCount: activeTemplates.length,
      upcomingGames: activeTemplates.slice(0, 10).map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        sourceType: t.sourceType ?? "manual",
        scheduledAt: t.scheduledTime.toISOString(),
      })),
    };
  }

  getActiveTemplates(): ScheduledGameTemplate[] {
    return this.gameScheduler.getActiveTemplates();
  }

  getTemplatesByCategory(category: string): ScheduledGameTemplate[] {
    return this.gameScheduler
      .getActiveTemplates()
      .filter((t) => t.category === category);
  }
}

let masterSchedulerInstance: MasterGameSchedulerService | null = null;

export function getMasterScheduler(
  createGameUseCase: CreatePredictionGameUseCase,
  config?: Partial<MasterSchedulerConfig>
): MasterGameSchedulerService {
  if (!masterSchedulerInstance) {
    masterSchedulerInstance = new MasterGameSchedulerService(
      createGameUseCase,
      config
    );
  }
  return masterSchedulerInstance;
}
