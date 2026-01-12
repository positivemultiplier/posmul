import { UserId } from "@posmul/auth-economy-sdk";
import type { PmpAmount } from "@posmul/auth-economy-sdk";

import { PredictionType } from "../../domain/value-objects/prediction-types";
import type { GameOptions } from "../../domain/value-objects/prediction-types";
import { CreatePredictionGameUseCase } from "../use-cases/create-prediction-game.use-case";
import { SettlementSourceType } from "../../domain/value-objects/settlement-types";

export interface ScheduledGameTemplate {
  id: string;
  title: string;
  description: string;
  predictionType: PredictionType;
  options: GameOptions;
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
  // 정산 소스 연동 (KOSIS, DART 등)
  sourceType?: SettlementSourceType;
  sourceConfig?: Record<string, unknown>;
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
      options: [
        { id: "home", label: "홈팀 승", description: "odds: 2.1" },
        { id: "draw", label: "무승부", description: "odds: 3.2" },
        { id: "away", label: "원정팀 승", description: "odds: 3.8" },
      ],
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
      options: [
        { id: "up", label: "상승 (2%p 이상)", description: "rank: 1" },
        { id: "slight_up", label: "소폭 상승 (1%p)", description: "rank: 2" },
        { id: "stable", label: "현상 유지 (±0.5%p)", description: "rank: 3" },
        { id: "slight_down", label: "소폭 하락 (-1%p)", description: "rank: 4" },
        { id: "down", label: "하락 (-2%p 이상)", description: "rank: 5" },
      ],
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
      options: [
        { id: "up", label: "상승", description: "odds: 1.95" },
        { id: "down", label: "하락", description: "odds: 1.95" },
      ],
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

    // ============================================================
    // KOSIS 경제지표 기반 예측 게임 템플릿
    // ============================================================

    // 소비자물가지수 예측 (매월 10일 발표)
    this.templates.push({
      id: "kosis-cpi-monthly",
      title: "이번 달 소비자물가 상승률 예측",
      description:
        "통계청 발표 소비자물가지수 전년동월대비 상승률을 예측하세요. 정확한 경제 지표 기반 정산!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "3% 초과", description: "물가 상승 심화" },
        { id: "below", label: "3% 이하", description: "물가 안정" },
      ],
      scheduledTime: this.getNextMonthlySchedule(1, 9), // 매월 1일 09:00 시작
      duration: 240, // 10일간 참여 가능
      settlementDelay: 1, // 발표 후 1시간 내 정산
      minimumStake: 2000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 1000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "kosis",
      sourceConfig: {
        indicatorCode: "CPI_RATE", // KOSIS 소비자물가지수 코드
        comparisonType: "greater",
        threshold: 3.0,
        optionMapping: { above: "above", below: "below" },
      },
    });

    // 월간 실업률 예측 (매월 15일 발표)
    this.templates.push({
      id: "kosis-unemployment-monthly",
      title: "이번 달 실업률 예측",
      description:
        "통계청 발표 실업률을 예측하세요. 고용 시장 동향을 읽어보세요!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "3.5% 초과", description: "고용 시장 악화" },
        { id: "below", label: "3.5% 이하", description: "고용 시장 안정" },
      ],
      scheduledTime: this.getNextMonthlySchedule(5, 9), // 매월 5일 09:00 시작
      duration: 240, // 10일간 참여 가능
      settlementDelay: 1,
      minimumStake: 2000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 1000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "kosis",
      sourceConfig: {
        indicatorCode: "UNEMPLOYMENT_RATE",
        comparisonType: "greater",
        threshold: 3.5,
        optionMapping: { above: "above", below: "below" },
      },
    });

    // ============================================================
    // DART 기업 공시 기반 예측 게임 템플릿
    // ============================================================

    // 삼성전자 분기 영업이익 예측 (분기별 실적 발표)
    this.templates.push({
      id: "dart-samsung-quarterly",
      title: "삼성전자 분기 영업이익 예측",
      description:
        "삼성전자 분기 실적 발표 영업이익을 예측하세요. DART 공시 기반 정확한 정산!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "10조원 초과", description: "실적 호조" },
        { id: "below", label: "10조원 이하", description: "실적 부진" },
      ],
      scheduledTime: this.getNextQuarterlySchedule(1, 9), // 분기 시작 1일 09:00
      duration: 720, // 30일간 참여 가능
      settlementDelay: 24, // 발표 후 24시간 내 정산
      minimumStake: 5000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 2000,
      creatorId: systemUserId,
      category: "economy",
      importance: "critical",
      recurrence: "monthly", // 분기별이지만 monthly로 관리
      isActive: true,
      sourceType: "dart",
      sourceConfig: {
        corpCode: "00126380", // 삼성전자 고유번호
        bsnsYear: new Date().getFullYear().toString(),
        reprtCode: "11013", // 1분기 보고서
        accountName: "영업이익",
        comparisonType: "greater",
        threshold: 10000000000000, // 10조원
        optionMapping: { above: "above", below: "below" },
      },
    });

    // 현대자동차 분기 영업이익 예측
    this.templates.push({
      id: "dart-hyundai-quarterly",
      title: "현대자동차 분기 영업이익 예측",
      description:
        "현대자동차 분기 실적 발표 영업이익을 예측하세요. 자동차 산업 동향 파악!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "3조원 초과", description: "실적 호조" },
        { id: "below", label: "3조원 이하", description: "실적 부진" },
      ],
      scheduledTime: this.getNextQuarterlySchedule(5, 9),
      duration: 720,
      settlementDelay: 24,
      minimumStake: 5000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 2000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "dart",
      sourceConfig: {
        corpCode: "00164742", // 현대자동차 고유번호
        bsnsYear: new Date().getFullYear().toString(),
        reprtCode: "11013",
        accountName: "영업이익",
        comparisonType: "greater",
        threshold: 3000000000000, // 3조원
        optionMapping: { above: "above", below: "below" },
      },
    });

    // SK하이닉스 분기 순이익 예측
    this.templates.push({
      id: "dart-skhynix-quarterly",
      title: "SK하이닉스 분기 순이익 예측",
      description:
        "SK하이닉스 분기 순이익을 예측하세요. 반도체 업황 흑자/적자 전환 게임!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "profit", label: "흑자", description: "순이익 0 초과" },
        { id: "loss", label: "적자", description: "순이익 0 이하" },
      ],
      scheduledTime: this.getNextQuarterlySchedule(10, 9),
      duration: 720,
      settlementDelay: 24,
      minimumStake: 5000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 2000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "dart",
      sourceConfig: {
        corpCode: "00164779", // SK하이닉스 고유번호
        bsnsYear: new Date().getFullYear().toString(),
        reprtCode: "11013",
        accountName: "당기순이익",
        comparisonType: "greater",
        threshold: 0, // 흑자/적자 판단
        optionMapping: { above: "profit", below: "loss" },
      },
    });

    // ============================================================
    // 미국 주식 시장 예측 (Alpha Vantage)
    // ============================================================

    // 나스닥 100 지수 (QQQ) 등락 예측 (매일)
    this.templates.push({
      id: "us-nasdaq-daily",
      title: "오늘의 나스닥(QQQ) 등락 예측",
      description:
        "나스닥 100 지수(QQQ)가 어제보다 오를까요? 내릴까요? 미국 기술주 시장 예측!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "up", label: "상승", description: "어제 종가보다 상승" },
        { id: "down", label: "하락", description: "어제 종가보다 하락" },
      ],
      scheduledTime: this.getNextDailyUSMarketOpen(), // 미국 장 시작 전 생성
      duration: 24, // 24시간
      settlementDelay: 1, // 장 마감 1시간 후 정산
      minimumStake: 1000 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 5000,
      creatorId: systemUserId,
      category: "economy",
      importance: "medium",
      recurrence: "daily",
      isActive: true,
      sourceType: "alpha-vantage",
      sourceConfig: {
        symbol: "QQQ", // Invesco QQQ Trust (나스닥 100 추종 ETF)
        comparisonType: "price_change_direction",
        optionMapping: { up: "up", down: "down" },
      },
    });

    // 엔비디아 (NVDA) 주가 등락 예측 (매일)
    this.templates.push({
      id: "us-nvda-daily",
      title: "엔비디아(NVDA) 주가 등락 예측",
      description:
        "AI 대장주 엔비디아, 오늘 주가는? 상승/하락을 예측해보세요.",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "up", label: "상승", description: "전일 대비 상승" },
        { id: "down", label: "하락", description: "전일 대비 하락" },
      ],
      scheduledTime: this.getNextDailyUSMarketOpen(),
      duration: 24,
      settlementDelay: 1,
      minimumStake: 1000 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 5000,
      creatorId: systemUserId,
      category: "technology",
      importance: "high",
      recurrence: "daily",
      isActive: true,
      sourceType: "alpha-vantage",
      sourceConfig: {
        symbol: "NVDA", // NVIDIA Corporation
        comparisonType: "price_change_direction",
        optionMapping: { up: "up", down: "down" },
      },
    });

    // ============================================================
    // 미국 기업 실적 예측 (FMP)
    // ============================================================

    // 애플 (AAPL) 분기 매출 예측
    this.templates.push({
      id: "us-aapl-revenue-quarterly",
      title: "애플(AAPL) 분기 매출 예측",
      description: "애플의 이번 분기 매출이 1,000억 달러를 넘을까요? 실적 시즌 빅이벤트!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "1,000억 달러 초과", description: "매출 호조" },
        { id: "below", label: "1,000억 달러 이하", description: "예상 하회" },
      ],
      scheduledTime: this.getNextQuarterlySchedule(1, 22), // 분기초 1일 22:00
      duration: 720,
      settlementDelay: 24,
      minimumStake: 5000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 5000,
      creatorId: systemUserId,
      category: "technology",
      importance: "critical",
      recurrence: "monthly",
      isActive: true,
      sourceType: "fmp",
      sourceConfig: {
        symbol: "AAPL",
        period: "quarter",
        accountName: "revenue",
        comparisonType: "greater",
        threshold: 100000000000, // 1000억 달러
        optionMapping: { above: "above", below: "below" },
      },
    });

    // 테슬라 (TSLA) 분기 순이익 예측
    this.templates.push({
      id: "us-tsla-income-quarterly",
      title: "테슬라(TSLA) 분기 순이익 예측",
      description: "테슬라가 이번 분기에 흑자를 낼 수 있을까요? 순이익 20억 달러 기준!",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "20억 달러 초과", description: "이익 급증" },
        { id: "below", label: "20억 달러 이하", description: "이익 감소" },
      ],
      scheduledTime: this.getNextQuarterlySchedule(1, 22),
      duration: 720,
      settlementDelay: 24,
      minimumStake: 5000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 5000,
      creatorId: systemUserId,
      category: "technology",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "fmp",
      sourceConfig: {
        symbol: "TSLA",
        period: "quarter",
        accountName: "netIncome",
        comparisonType: "greater",
        threshold: 2000000000, // 20억 달러
        optionMapping: { above: "above", below: "below" },
      },
    });
  }

  /**
   * 다음 미국 주식 시장 개장 시간 전 (한국 시간 기준 매일 20:00)
   */
  private getNextDailyUSMarketOpen(): Date {
    const now = new Date();
    const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  /**
   * 다음 월간 스케줄 날짜 계산
   */
  private getNextMonthlySchedule(dayOfMonth: number, hour: number): Date {
    const now = new Date();
    const result = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, 0, 0);
    if (result <= now) {
      result.setMonth(result.getMonth() + 1);
    }
    return result;
  }

  /**
   * 다음 분기 스케줄 날짜 계산 (1, 4, 7, 10월)
   */
  private getNextQuarterlySchedule(dayOfMonth: number, hour: number): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const quarterStartMonths = [0, 3, 6, 9]; // 1월, 4월, 7월, 10월

    // 현재 월 이후의 다음 분기 시작월 찾기
    let nextQuarterMonth = quarterStartMonths.find(m => m > currentMonth);
    if (nextQuarterMonth === undefined) {
      nextQuarterMonth = 0; // 다음 해 1월
    }

    const year = nextQuarterMonth === 0 && currentMonth >= 9
      ? now.getFullYear() + 1
      : now.getFullYear();

    return new Date(year, nextQuarterMonth, dayOfMonth, hour, 0, 0);
  }

  /**
   * 스케줄링 시스템 시작
   */
  async startScheduling(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

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
  }

  /**
   * 스케줄링 시스템 중지
   */
  stopScheduling(): void {
    this.isRunning = false;
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
      } else {
        // 실패 로깅은 생략
      }
    } catch (error) {
      void error;
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

    void currentHour;

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
    void totalGames;
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
