/**
 * 마스터 게임 스케줄러 서비스
 * 
 * 모든 데이터 소스를 통합하여 정기 게임을 자동 생성
 * - Football Data: 축구 경기
 * - FMP Earnings: 기업 실적 발표
 * - 기존 GameSchedulingService의 템플릿
 */

import { CreatePredictionGameUseCase } from "../use-cases/create-prediction-game.use-case";
import { GameSchedulingService, ScheduledGameTemplate } from "./game-scheduling.service";
import { FootballMatchSchedulerService } from "./football-match-scheduler.service";
import { EarningsCalendarSchedulerService } from "./earnings-calendar-scheduler.service";

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
            syncIntervalMinutes: 60, // 1시간마다 동기화
            ...config,
        };

        this.gameScheduler = new GameSchedulingService(createGameUseCase);

        // 조건부 초기화 (API 키 없으면 스킵)
        try {
            if (this.config.enableFootball && process.env.FOOTBALL_DATA_API_KEY) {
                this.footballScheduler = new FootballMatchSchedulerService();
            }
        } catch (error) {
            console.warn("[MasterScheduler] Football scheduler disabled:", error);
        }

        try {
            if (this.config.enableEarnings && process.env.FMP_API_KEY) {
                this.earningsScheduler = new EarningsCalendarSchedulerService();
            }
        } catch (error) {
            console.warn("[MasterScheduler] Earnings scheduler disabled:", error);
        }
    }

    /**
     * 마스터 스케줄러 시작
     */
    async start(): Promise<void> {
        console.log("[MasterScheduler] Starting...");

        // 초기 동기화
        await this.syncAllSources();

        // 기존 스케줄링 시스템 시작
        await this.gameScheduler.startScheduling();

        // 주기적 동기화 설정
        this.syncInterval = setInterval(
            () => this.syncAllSources(),
            this.config.syncIntervalMinutes * 60 * 1000
        );

        console.log("[MasterScheduler] Started successfully");
    }

    /**
     * 마스터 스케줄러 중지
     */
    stop(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.gameScheduler.stopScheduling();
        console.log("[MasterScheduler] Stopped");
    }

    /**
     * 모든 데이터 소스 동기화
     */
    async syncAllSources(): Promise<void> {
        console.log("[MasterScheduler] Syncing all sources...");

        const newTemplates: ScheduledGameTemplate[] = [];

        // Football 경기 동기화
        if (this.footballScheduler) {
            try {
                const footballTemplates = await this.footballScheduler.generateDailyGameTemplates();
                newTemplates.push(...footballTemplates);
                console.log(`[MasterScheduler] Added ${footballTemplates.length} football games`);
            } catch (error) {
                console.error("[MasterScheduler] Football sync error:", error);
            }
        }

        // 실적 발표 동기화
        if (this.earningsScheduler) {
            try {
                const earningsTemplates = await this.earningsScheduler.generateWeeklyEarningsGames();
                newTemplates.push(...earningsTemplates);
                console.log(`[MasterScheduler] Added ${earningsTemplates.length} earnings games`);
            } catch (error) {
                console.error("[MasterScheduler] Earnings sync error:", error);
            }
        }

        // 중복 제거 후 추가
        for (const template of newTemplates) {
            const existing = this.gameScheduler.getActiveTemplates()
                .find(t => t.id === template.id);

            if (!existing) {
                this.gameScheduler.addTemplate(template);
            }
        }

        console.log(`[MasterScheduler] Sync complete. Total templates: ${this.gameScheduler.getActiveTemplates().length
            }`);
    }

    /**
     * 수동 동기화 트리거
     */
    async triggerSync(): Promise<void> {
        await this.syncAllSources();
    }

    /**
     * 현재 상태 조회
     */
    getStatus() {
        return {
            isRunning: this.syncInterval !== null,
            config: this.config,
            schedulingStats: this.gameScheduler.getSchedulingStats(),
            footballEnabled: this.footballScheduler !== null,
            earningsEnabled: this.earningsScheduler !== null,
        };
    }

    /**
     * 활성 템플릿 목록 조회
     */
    getActiveTemplates(): ScheduledGameTemplate[] {
        return this.gameScheduler.getActiveTemplates();
    }

    /**
     * 카테고리별 활성 템플릿 조회
     */
    getTemplatesByCategory(category: string): ScheduledGameTemplate[] {
        return this.gameScheduler.getActiveTemplates()
            .filter(t => t.category === category);
    }
}

// 싱글톤 인스턴스 (선택적)
let masterSchedulerInstance: MasterGameSchedulerService | null = null;

export function getMasterScheduler(
    createGameUseCase: CreatePredictionGameUseCase,
    config?: Partial<MasterSchedulerConfig>
): MasterGameSchedulerService {
    if (!masterSchedulerInstance) {
        masterSchedulerInstance = new MasterGameSchedulerService(createGameUseCase, config);
    }
    return masterSchedulerInstance;
}
