import { Result, UserId } from "@posmul/auth-economy-sdk";
import type { PmpAmount } from "@posmul/auth-economy-sdk";

import { PredictionType } from "../../domain/value-objects/prediction-types";
import { CreatePredictionGameUseCase } from "../use-cases/create-prediction-game.use-case";

export interface ScheduledGameTemplate {
  id: string;
  title: string;
  description: string;
  predictionType: PredictionType;
  options: any;
  scheduledTime: Date; // 생성될 시간
  duration: number; // 게임 지속 시간 (시간 단위)
  settlementDelay: number; // 정산까지의 지연 시간 (시간 단위)
  minimumStake: PmpAmount;
  maximumStake: PmpAmount;
  maxParticipants: number;
  creatorId: UserId;
  category:
    | "sports"
    | "politics"
    | "economy"
    | "entertainment"
    | "weather"
    | "technology";
  importance: "low" | "medium" | "high" | "critical";
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  isActive: boolean;
}

export interface GameSchedulingConfig {
  // 시간별 게임 생성 정책
  gamesPerHour: number; // 시간당 생성할 게임 수
  peakHours: number[]; // 피크 시간대 (더 많은 게임 생성)
  quietHours: number[]; // 조용한 시간대 (적은 게임 생성)

  // MoneyWave 기반 스케줄링
  minHourlyPoolThreshold: number; // 최소 시간당 상금 풀
  gameAllocationStrategy: "balanced" | "peak_focused" | "importance_weighted";

  // 자동 게임 생성 규칙
  autoGenerateEnabled: boolean;
  categoryRotation: string[]; // 카테고리 순환 배치
  difficultyDistribution: { [key: string]: number }; // 난이도별 비율
}

/**
 * Phase 2: 게임 생성 스케줄링 시스템
 * MoneyWave와 연동하여 최적의 게임 생성 시간과 배치를 결정
 */
export class GameSchedulingService {
  private templates: ScheduledGameTemplate[] = [];
  private config: GameSchedulingConfig;
  private isRunning = false;

  constructor(
    private readonly createGameUseCase: CreatePredictionGameUseCase,
    config?: Partial<GameSchedulingConfig>
  ) {
    this.config = {
      gamesPerHour: 2,
      peakHours: [9, 12, 15, 18, 21], // 오전 9시, 정오, 오후 3시, 6시, 9시
      quietHours: [1, 2, 3, 4, 5, 6], // 새벽 시간
      minHourlyPoolThreshold: 158400000, // 1.5억 (Phase 2 기준)
      gameAllocationStrategy: "importance_weighted",
      autoGenerateEnabled: true,
      categoryRotation: ["sports", "politics", "economy", "entertainment"],
      difficultyDistribution: {
        easy: 0.4, // 40%
        medium: 0.4, // 40%
        hard: 0.15, // 15%
        expert: 0.05, // 5%
      },
      ...config,
    };

    this.initializeDefaultTemplates();
  }

  /**
   * 기본 게임 템플릿들 초기화
   */
  private initializeDefaultTemplates(): void {
    const now = new Date();
    const systemUserId = "system-scheduler" as UserId;

    // 스포츠 카테고리 템플릿들
    this.templates.push({
      id: "daily-soccer-match",
      title: "오늘의 축구 경기 예측",
      description:
        "프리미어리그 주요 경기 결과를 예측해보세요. MoneyWave 기반 상금 지급!",
      predictionType: PredictionType.WIN_DRAW_LOSE,
      options: {
        type: PredictionType.WIN_DRAW_LOSE,
        choices: [
          { id: "home", text: "홈팀 승", odds: 2.1 },
          { id: "draw", text: "무승부", odds: 3.2 },
          { id: "away", text: "원정팀 승", odds: 3.8 },
        ],
      },
      scheduledTime: new Date(now.getTime() + 60 * 60 * 1000), // 1시간 후
      duration: 12, // 12시간 지속
      settlementDelay: 2, // 2시간 후 정산
      minimumStake: 1000 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 500,
      creatorId: systemUserId,
      category: "sports",
      importance: "medium",
      recurrence: "daily",
      isActive: true,
    });

    // 정치 카테고리 템플릿
    this.templates.push({
      id: "weekly-approval-rating",
      title: "대통령 지지율 예측",
      description:
        "이번 주 대통령 지지율 변동을 예측하세요. 고난이도 고수익 게임!",
      predictionType: PredictionType.RANKING,
      options: {
        type: PredictionType.RANKING,
        choices: [
          { id: "up", text: "상승 (2%p 이상)", rank: 1 },
          { id: "slight_up", text: "소폭 상승 (1%p)", rank: 2 },
          { id: "stable", text: "현상 유지 (±0.5%p)", rank: 3 },
          { id: "slight_down", text: "소폭 하락 (-1%p)", rank: 4 },
          { id: "down", text: "하락 (-2%p 이상)", rank: 5 },
        ],
      },
      scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2시간 후
      duration: 168, // 1주일 지속
      settlementDelay: 24, // 24시간 후 정산
      minimumStake: 5000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 1000,
      creatorId: systemUserId,
      category: "politics",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
    });

    // 경제 카테고리 템플릿
    this.templates.push({
      id: "hourly-crypto-price",
      title: "비트코인 시간별 가격 예측",
      description: "다음 시간 비트코인 가격 방향을 예측하세요. 단기 고수익!",
      predictionType: PredictionType.BINARY,
      options: {
        type: PredictionType.BINARY,
        choices: [
          { id: "up", text: "상승", odds: 1.95 },
          { id: "down", text: "하락", odds: 1.95 },
        ],
      },
      scheduledTime: new Date(now.getTime() + 30 * 60 * 1000), // 30분 후
      duration: 1, // 1시간 지속
      settlementDelay: 0.5, // 30분 후 정산
      minimumStake: 500 as PmpAmount,
      maximumStake: 30000 as PmpAmount,
      maxParticipants: 200,
      creatorId: systemUserId,
      category: "economy",
      importance: "low",
      recurrence: "daily",
      isActive: true,
    });
  }

  /**
   * 스케줄링 시스템 시작
   */
  async startScheduling(): Promise<void> {
    if (this.isRunning) {
      console.log("Game scheduling is already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Game Scheduling Service started");

    // 매분마다 스케줄 확인
    setInterval(async () => {
      await this.checkAndCreateScheduledGames();
    }, 60 * 1000); // 1분 간격

    // 매시간마다 동적 게임 생성
    setInterval(
      async () => {
        await this.createDynamicGames();
      },
      60 * 60 * 1000
    ); // 1시간 간격

    console.log("⏰ Scheduled game creation monitoring active");
  }

  /**
   * 스케줄링 시스템 중지
   */
  stopScheduling(): void {
    this.isRunning = false;
    console.log("⏹️ Game Scheduling Service stopped");
  }

  /**
   * 예정된 게임들 확인 및 생성
   */
  private async checkAndCreateScheduledGames(): Promise<void> {
    const now = new Date();

    for (const template of this.templates) {
      if (!template.isActive) continue;

      // 생성 시간이 되었는지 확인 (±2분 오차 허용)
      const timeDiff = Math.abs(
        now.getTime() - template.scheduledTime.getTime()
      );
      const shouldCreate = timeDiff <= 2 * 60 * 1000; // 2분 오차

      if (shouldCreate) {
        await this.createGameFromTemplate(template);

        // 반복 생성인 경우 다음 스케줄 설정
        if (template.recurrence && template.recurrence !== "once") {
          this.updateTemplateSchedule(template);
        } else {
          template.isActive = false; // 일회성 게임은 비활성화
        }
      }
    }
  }

  /**
   * 템플릿으로부터 게임 생성
   */
  private async createGameFromTemplate(
    template: ScheduledGameTemplate
  ): Promise<void> {
    try {
      const now = new Date();
      const endTime = new Date(
        now.getTime() + template.duration * 60 * 60 * 1000
      );
      const settlementTime = new Date(
        endTime.getTime() + template.settlementDelay * 60 * 60 * 1000
      );

      const result = await this.createGameUseCase.execute({
        title: template.title,
        description: template.description,
        predictionType: template.predictionType as any,
        options: template.options,
        startTime: now,
        endTime,
        settlementTime,
        creatorId: template.creatorId,
        minimumStake: template.minimumStake,
        maximumStake: template.maximumStake,
        maxParticipants: template.maxParticipants,
      });

      if (result.success) {
        console.log(
          `✅ Scheduled game created: ${template.title} (${result.data.gameId})`
        );
      } else {
        console.error(`❌ Failed to create scheduled game: ${template.title}`);
      }
    } catch (error) {
      console.error(
        `🚫 Error creating game from template ${template.id}:`,
        error
      );
    }
  }

  /**
   * 템플릿의 다음 스케줄 업데이트
   */
  private updateTemplateSchedule(template: ScheduledGameTemplate): void {
    const current = template.scheduledTime;

    switch (template.recurrence) {
      case "daily":
        template.scheduledTime = new Date(
          current.getTime() + 24 * 60 * 60 * 1000
        );
        break;
      case "weekly":
        template.scheduledTime = new Date(
          current.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        break;
      case "monthly":
        template.scheduledTime = new Date(
          current.getTime() + 30 * 24 * 60 * 60 * 1000
        );
        break;
    }

    console.log(
      `📅 Template ${template.id} next scheduled for: ${template.scheduledTime.toLocaleString()}`
    );
  }

  /**
   * MoneyWave 상태에 따른 동적 게임 생성
   */
  private async createDynamicGames(): Promise<void> {
    const currentHour = new Date().getHours();
    let gamesToCreate = this.config.gamesPerHour;

    // 피크 시간대 조정
    if (this.config.peakHours.includes(currentHour)) {
      gamesToCreate = Math.ceil(gamesToCreate * 1.5); // 50% 증가
    } else if (this.config.quietHours.includes(currentHour)) {
      gamesToCreate = Math.max(1, Math.ceil(gamesToCreate * 0.5)); // 50% 감소
    }

    console.log(
      `🎮 Creating ${gamesToCreate} dynamic games for hour ${currentHour}`
    );

    for (let i = 0; i < gamesToCreate; i++) {
      await this.createDynamicGame(i, gamesToCreate);

      // 게임 간 간격 (동시 생성 방지)
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 간격
    }
  }

  /**
   * 단일 동적 게임 생성
   */
  private async createDynamicGame(
    index: number,
    totalGames: number
  ): Promise<void> {
    const category =
      this.config.categoryRotation[index % this.config.categoryRotation.length];
    const difficulty = this.selectRandomDifficulty();

    // 카테고리별 게임 템플릿 선택
    const gameTemplate = this.generateDynamicGameTemplate(category, difficulty);

    if (gameTemplate) {
      await this.createGameFromTemplate(gameTemplate);
    }
  }

  /**
   * 확률 기반 난이도 선택
   */
  private selectRandomDifficulty(): string {
    const random = Math.random();
    let cumulative = 0;

    for (const [difficulty, probability] of Object.entries(
      this.config.difficultyDistribution
    )) {
      cumulative += probability;
      if (random <= cumulative) {
        return difficulty;
      }
    }

    return "medium"; // 기본값
  }

  /**
   * 동적 게임 템플릿 생성
   */
  private generateDynamicGameTemplate(
    category: string,
    difficulty: string
  ): ScheduledGameTemplate | null {
    const now = new Date();
    const templates = this.templates.filter((t) => t.category === category);

    if (templates.length === 0) return null;

    // 랜덤 템플릿 선택 후 수정
    const baseTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    return {
      ...baseTemplate,
      id: `dynamic-${category}-${now.getTime()}`,
      title: `[동적생성] ${baseTemplate.title} #${now.getHours()}`,
      scheduledTime: now,
      importance: difficulty as any,
      recurrence: "once",
    };
  }

  /**
   * 활성 템플릿 목록 조회
   */
  getActiveTemplates(): ScheduledGameTemplate[] {
    return this.templates.filter((t) => t.isActive);
  }

  /**
   * 새 템플릿 추가
   */
  addTemplate(template: ScheduledGameTemplate): void {
    this.templates.push(template);
    console.log(`📝 New template added: ${template.id}`);
  }

  /**
   * 스케줄링 통계
   */
  getSchedulingStats() {
    const activeTemplates = this.templates.filter((t) => t.isActive).length;
    const totalTemplates = this.templates.length;

    return {
      activeTemplates,
      totalTemplates,
      isRunning: this.isRunning,
      nextScheduledGame: this.getNextScheduledTime(),
      config: this.config,
    };
  }

  /**
   * 다음 예정 게임 시간
   */
  private getNextScheduledTime(): Date | null {
    const activeTemplates = this.templates.filter((t) => t.isActive);
    if (activeTemplates.length === 0) return null;

    return activeTemplates.sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    )[0].scheduledTime;
  }
}
