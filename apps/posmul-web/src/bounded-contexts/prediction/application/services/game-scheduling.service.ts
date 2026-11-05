import { UserId } from "@posmul/auth-economy-sdk";
import type { PmpAmount } from "@posmul/auth-economy-sdk";

import type { GameOptions } from "../../domain/value-objects/prediction-types";
import { PredictionType } from "../../domain/value-objects/prediction-types";
import { SettlementSourceType } from "../../domain/value-objects/settlement-types";
import { CreatePredictionGameUseCase } from "../use-cases/create-prediction-game.use-case";
import { settlementOrchestrator } from "./settlement-orchestrator.service";

export interface ScheduledGameTemplate {
  id: string;
  title: string;
  description: string;
  predictionType: PredictionType;
  options: GameOptions;
  scheduledTime: Date; // 게임 오픈 시간 (openAt)
  duration: number; // 게임 지속 시간 (시간 단위, openAt + duration = closeAt: 발표/방영 1시간 전 마감)
  settlementDelay: number; // 마감 후 정산까지의 지연 시간 (시간 단위, closeAt + settlementDelay = settleAt)
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
  /** 정산 오라클 소스 타입 (ECOS, KOSIS, DART, KOBIS, FMP, AlphaVantage, Football-Data 등) */
  sourceType?: SettlementSourceType;
  /** 오라클 판정 설정 */
  sourceConfig?: Record<string, unknown>;
}

export interface GameSchedulingConfig {
  gamesPerHour: number;
  peakHours: number[];
  quietHours: number[];
  minHourlyPoolThreshold: number;
  gameAllocationStrategy: "balanced" | "peak_focused" | "importance_weighted";
  autoGenerateEnabled: boolean;
  categoryRotation: string[];
  difficultyDistribution: { [key: string]: number };
}

/**
 * 정기 경제지표(한국은행 ECOS · 통계청 KOSIS · 금감원 DART),
 * 글로벌 증시(FMP · AlphaVantage), 스포츠(Football-Data),
 * K-콘텐츠(영진위 KOBIS 영화 · 드라마 시청률 · 예능 · K-POP 음원 차트)를
 * 표준 타임라인(발표/방영 1시간 전 마감 + 오라클 자동 등록)으로 생성하는 스케줄링 엔진
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
      peakHours: [9, 12, 15, 18, 21],
      quietHours: [1, 2, 3, 4, 5, 6],
      minHourlyPoolThreshold: 158400000,
      gameAllocationStrategy: "importance_weighted",
      autoGenerateEnabled: true,
      categoryRotation: ["economy", "entertainment", "sports", "politics"],
      difficultyDistribution: {
        easy: 0.4,
        medium: 0.4,
        hard: 0.15,
        expert: 0.05,
      },
      ...config,
    };

    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const systemUserId = "00000000-0000-0000-0000-000000000001" as UserId;

    this.registerBOKTemplates(systemUserId);
    this.registerKosisTemplates(systemUserId);
    this.registerDartTemplates(systemUserId);
    this.registerKContentTemplates(systemUserId);
    this.registerGlobalMarketTemplates(systemUserId);
  }

  /**
   * 1. 한국은행(ECOS) 공식 통화정책 & 거시경제 지표 정기 템플릿
   */
  private registerBOKTemplates(systemUserId: UserId): void {
    // 1-1. 금융통화위원회 기준금리 결정 (인상 / 동결 / 인하 3지선다, 발표일 09:00 마감 -> 11:00 정산)
    this.templates.push({
      id: "ecos-bok-base-rate",
      title: "[금통위] 한국은행 이번 금융통화위원회 기준금리 결정은?",
      description:
        "한국은행 금융통화위원회 본회의 기준금리 결정(인상·동결·인하)을 예측하세요.\n📅 마감: 금통위 발표 1시간 전(09:00) | 🏛️ 정산: 한국은행 ECOS 공식 통계표(722Y001)",
      predictionType: PredictionType.WIN_DRAW_LOSE,
      options: [
        { id: "hike", label: "금리 인상 (Hike)", description: "직전 기준금리 대비 인상" },
        { id: "hold", label: "금리 동결 (Hold)", description: "직전 기준금리 유지" },
        { id: "cut", label: "금리 인하 (Cut)", description: "직전 기준금리 대비 인하" },
      ],
      scheduledTime: this.getNextMonthlySchedule(15, 9),
      duration: 168, // 7일간 오픈 후 발표일 09:00 마감
      settlementDelay: 2, // 마감 2시간 후(11:00) ECOS 정산
      minimumStake: 2000 as PmpAmount,
      maximumStake: 200000 as PmpAmount,
      maxParticipants: 5000,
      creatorId: systemUserId,
      category: "economy",
      importance: "critical",
      recurrence: "monthly",
      isActive: true,
      sourceType: "ecos",
      sourceConfig: {
        statCode: "722Y001",
        cycle: "M",
        itemCode1: "0101000",
        comparisonType: "change_direction",
        optionMapping: { hike: "hike", hold: "hold", cut: "cut" },
      },
    });

    // 1-2. 한국 분기 실질 GDP 성장률(전기대비) 속보치 예측
    this.templates.push({
      id: "ecos-bok-gdp-quarterly",
      title: "[한국은행] 이번 분기 실질 GDP 성장률(전기비) 0.5% 돌파할까?",
      description:
        "한국은행이 발표하는 분기 실질 국내총생산(GDP) 속보치 성장률이 전기 대비 0.5%를 상회할지 예측하세요.\n📅 마감: 발표 1시간 전(07:00) | 🏛️ 정산: 한국은행 ECOS(200Y101)",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "0.5% 초과 (성장 호조)", description: "전기비 성장률 > 0.5%" },
        { id: "below", label: "0.5% 이하 (성장 둔화)", description: "전기비 성장률 ≤ 0.5%" },
      ],
      scheduledTime: this.getNextQuarterlySchedule(15, 8),
      duration: 239, // 발표 1시간 전 마감
      settlementDelay: 2,
      minimumStake: 2000 as PmpAmount,
      maximumStake: 150000 as PmpAmount,
      maxParticipants: 3000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "ecos",
      sourceConfig: {
        statCode: "200Y101",
        cycle: "Q",
        itemCode1: "10101",
        comparisonType: "greater",
        threshold: 0.5,
        optionMapping: { above: "above", below: "below" },
      },
    });

    // 1-3. 한국 월간 경상수지 흑자 규모 예측
    this.templates.push({
      id: "ecos-bok-current-account",
      title: "[국제수지] 한국 이번 달 경상수지 흑자 50억 달러 상회할까?",
      description:
        "반도체·자동차 수출 실적에 따른 한국은행 월간 국제수지(경상수지) 잠정치 흑자 규모를 예측하세요.\n📅 마감: 발표 1시간 전(07:00) | 🏛️ 정산: 한국은행 ECOS(301Y013)",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "50억 달러 초과", description: "수출 흑자 확대" },
        { id: "below", label: "50억 달러 이하", description: "흑자 축소 또는 적자" },
      ],
      scheduledTime: this.getNextMonthlySchedule(1, 8),
      duration: 167,
      settlementDelay: 2,
      minimumStake: 1000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 2000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "ecos",
      sourceConfig: {
        statCode: "301Y013",
        cycle: "M",
        itemCode1: "000000",
        comparisonType: "greater",
        threshold: 5000,
        optionMapping: { above: "above", below: "below" },
      },
    });
  }

  /**
   * 2. 통계청(KOSIS) 월간 민생·거시 통계 정기 템플릿
   */
  private registerKosisTemplates(systemUserId: UserId): void {
    // 2-1. 소비자물가지수(CPI) 상승률 (매월 초 08:00 발표 -> 07:00 마감)
    this.templates.push({
      id: "kosis-cpi-monthly",
      title: "[통계청] 이번 달 소비자물가 상승률(전년동월비) 2.5% 상회할까?",
      description:
        "통계청 소비자물가동향 발표 기준 전년동월대비 물가상승률이 2.5%를 넘을지 예측하세요.\n📅 마감: 발표일 07:00 (발표 1시간 전) | 📊 정산: 통계청 KOSIS(DT_1J22003)",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "2.5% 초과 (물가 상방압력)", description: "CPI 상승률 > 2.5%" },
        { id: "below", label: "2.5% 이하 (물가 안정세)", description: "CPI 상승률 ≤ 2.5%" },
      ],
      scheduledTime: this.getNextMonthlySchedule(1, 8),
      duration: 47, // 2일 뒤 07:00 마감
      settlementDelay: 2, // 09:00 정산
      minimumStake: 1000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 2000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "kosis",
      sourceConfig: {
        indicatorCode: "CPI_RATE",
        orgId: "101",
        tblId: "DT_1J22003",
        itmId: "T03",
        prdSe: "M",
        comparisonType: "greater",
        threshold: 2.5,
        optionMapping: { above: "above", below: "below" },
      },
    });

    // 2-2. 월간 실업률 (매월 중순 08:00 발표 -> 07:00 마감)
    this.templates.push({
      id: "kosis-unemployment-monthly",
      title: "[고용동향] 통계청 이번 달 전국 실업률 3.0% 이하 기록할까?",
      description:
        "통계청 경제활동인구조사 월간 고용동향 실업률 지표를 예측하세요.\n📅 마감: 발표일 07:00 | 📊 정산: 통계청 KOSIS(DT_1DA7004S)",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "below", label: "3.0% 이하 (고용 호조)", description: "실업률 ≤ 3.0%" },
        { id: "above", label: "3.0% 초과 (고용 둔화)", description: "실업률 > 3.0%" },
      ],
      scheduledTime: this.getNextMonthlySchedule(5, 8),
      duration: 167,
      settlementDelay: 2,
      minimumStake: 1000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 1500,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "kosis",
      sourceConfig: {
        indicatorCode: "UNEMPLOYMENT_RATE",
        orgId: "101",
        tblId: "DT_1DA7004S",
        itmId: "T80",
        prdSe: "M",
        comparisonType: "greater",
        threshold: 3.0,
        optionMapping: { above: "above", below: "below" },
      },
    });
  }

  /**
   * 3. 금융감독원(DART) 국내 대표 상장사 분기 실적 정기 템플릿
   */
  private registerDartTemplates(systemUserId: UserId): void {
    const dartCorporations: Array<{
      id: string;
      name: string;
      corpCode: string;
      accountName: string;
      threshold: number;
      thresholdLabel: string;
      importance: "high" | "critical";
    }> = [
      {
        id: "dart-samsung-quarterly",
        name: "삼성전자",
        corpCode: "00126380",
        accountName: "영업이익",
        threshold: 10_000_000_000_000,
        thresholdLabel: "10조 원",
        importance: "critical",
      },
      {
        id: "dart-skhynix-quarterly",
        name: "SK하이닉스",
        corpCode: "00164779",
        accountName: "영업이익",
        threshold: 5_000_000_000_000,
        thresholdLabel: "5조 원",
        importance: "critical",
      },
      {
        id: "dart-hyundai-quarterly",
        name: "현대자동차",
        corpCode: "00164742",
        accountName: "영업이익",
        threshold: 3_500_000_000_000,
        thresholdLabel: "3조 5,000억 원",
        importance: "high",
      },
      {
        id: "dart-naver-quarterly",
        name: "NAVER",
        corpCode: "00266961",
        accountName: "영업이익",
        threshold: 500_000_000_000,
        thresholdLabel: "5,000억 원",
        importance: "high",
      },
      {
        id: "dart-kakao-quarterly",
        name: "카카오",
        corpCode: "00258801",
        accountName: "영업이익",
        threshold: 150_000_000_000,
        thresholdLabel: "1,500억 원",
        importance: "high",
      },
    ];

    dartCorporations.forEach((corp, idx) => {
      this.templates.push({
        id: corp.id,
        title: `[실적공시] ${corp.name} 이번 분기 연결 ${corp.accountName} ${corp.thresholdLabel} 돌파할까?`,
        description: `${corp.name}의 분기 보고서(연결재무제표 기준) ${corp.accountName}이 ${corp.thresholdLabel}을 상회할지 예측하세요.\n📅 마감: 공시 마감 1시간 전 | 📑 정산: 금융감독원 OpenDART 공식 재무제표 API`,
        predictionType: PredictionType.BINARY,
        options: [
          {
            id: "above",
            label: `${corp.thresholdLabel} 초과 (어닝 서프라이즈)`,
            description: `${corp.accountName} > ${corp.thresholdLabel}`,
          },
          {
            id: "below",
            label: `${corp.thresholdLabel} 이하 (예상 부합·하회)`,
            description: `${corp.accountName} ≤ ${corp.thresholdLabel}`,
          },
        ],
        scheduledTime: this.getNextQuarterlySchedule(1 + idx * 2, 9),
        duration: 720,
        settlementDelay: 24,
        minimumStake: 2000 as PmpAmount,
        maximumStake: 200000 as PmpAmount,
        maxParticipants: 3000,
        creatorId: systemUserId,
        category: "economy",
        importance: corp.importance,
        recurrence: "monthly",
        isActive: true,
        sourceType: "dart",
        sourceConfig: {
          corpCode: corp.corpCode,
          bsnsYear: "auto",
          reprtCode: "auto",
          accountName: corp.accountName,
          comparisonType: "greater",
          threshold: corp.threshold,
          optionMapping: { above: "above", below: "below" },
        },
      });
    });
  }

  /**
   * 4. K-콘텐츠 (영화 박스오피스 · 주말 드라마 시청률 · 예능 · K-POP 음원 차트) 정기 템플릿
   */
  private registerKContentTemplates(systemUserId: UserId): void {
    // 4-1. 주말 박스오피스 1위 누적 관객 돌파 예측 (영진위 KOBIS API 연동)
    this.templates.push({
      id: "kobis-weekend-boxoffice",
      title: "[주말극장] 이번 주말 박스오피스 1위 영화, 누적 관객 100만 돌파할까?",
      description:
        "영화진흥위원회 통합전산망(KOBIS) 주말 박스오피스 1위 작품의 누적 관객수가 일요일 자정 기준 100만 명을 돌파할지 예측하세요.\n📅 마감: 금요일 18:00 (주말 집계 시작 전) | 🎬 정산: 월요일 09:00 KOBIS API",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "above", label: "100만 관객 돌파 (Yes)", description: "누적 관객수 ≥ 1,000,000명" },
        { id: "below", label: "100만 관객 미달 (No)", description: "누적 관객수 < 1,000,000명" },
      ],
      scheduledTime: this.getNextWeeklySchedule(3, 9), // 매주 수요일 09:00 오픈
      duration: 57, // 금요일 18:00 마감
      settlementDelay: 63, // 월요일 09:00 정산
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 3000,
      creatorId: systemUserId,
      category: "entertainment",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
      sourceType: "kobis",
      sourceConfig: {
        mode: "audience_threshold",
        periodType: "weekend",
        threshold: 1_000_000,
        optionMapping: { above: "above", below: "below" },
      },
    });

    // 4-2. 주말 미니시리즈 시청률 돌파 예측 (매주 목요일 오픈 -> 토요일 21:00 마감 -> 일요일 09:00 정산)
    this.templates.push({
      id: "kcontent-weekend-drama-rating",
      title: "[주말드라마] 이번 주 금토·주말 미니시리즈 최고 시청률 12% 돌파할까?",
      description:
        "이번 주말 방영되는 지상파·종편·케이블 미니시리즈 중 닐슨코리아 전국 가구 기준 시청률 12.0% 돌파 작품이 나올지 예측하세요.\n📅 마감: 토요일 21:00 (본방송 1시간 전) | 📺 정산: 일요일 09:00 시청률 발표",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "yes", label: "12.0% 이상 돌파 (Yes)", description: "전국 가구 시청률 ≥ 12.0%" },
        { id: "no", label: "12.0% 미만 (No)", description: "전국 가구 시청률 < 12.0%" },
      ],
      scheduledTime: this.getNextWeeklySchedule(4, 9), // 매주 목요일 09:00 오픈
      duration: 60, // 토요일 21:00 마감
      settlementDelay: 12, // 일요일 09:00 정산
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 2500,
      creatorId: systemUserId,
      category: "entertainment",
      importance: "medium",
      recurrence: "weekly",
      isActive: true,
      sourceType: "kcontent",
      sourceConfig: {
        subCategory: "drama_rating",
        metric: "nielsen_national_household",
        threshold: 12.0,
        optionMapping: { above: "yes", below: "no" },
      },
    });

    // 4-3. 일요일 황금시간대 예능 시청률 대전
    this.templates.push({
      id: "kcontent-sunday-variety-king",
      title: "[예능대전] 이번 주 일요일 프라임타임 예능 시청률 1위 방송사는?",
      description:
        "일요일 저녁 황금시간대(18:00~23:00) 방영 예능 프로그램 중 최고 시청률 1위를 기록할 채널군을 예측하세요.\n📅 마감: 일요일 17:00 (방영 1시간 전) | 🏆 정산: 월요일 09:00 시청률 집계",
      predictionType: PredictionType.WIN_DRAW_LOSE,
      options: [
        { id: "sbs_kbs", label: "SBS · KBS 지상파", description: "미운우리새끼 · 1박2일 등" },
        { id: "mbc", label: "MBC 예능", description: "복면가왕 · 태어난김에 등" },
        { id: "cable_jtbc", label: "tvN · JTBC 등 종편/케이블", description: "케이블/종편 일요 예능" },
      ],
      scheduledTime: this.getNextWeeklySchedule(5, 9), // 매주 금요일 09:00 오픈
      duration: 56, // 일요일 17:00 마감
      settlementDelay: 16, // 월요일 09:00 정산
      minimumStake: 500 as PmpAmount,
      maximumStake: 40000 as PmpAmount,
      maxParticipants: 2000,
      creatorId: systemUserId,
      category: "entertainment",
      importance: "medium",
      recurrence: "weekly",
      isActive: true,
      sourceType: "kcontent",
      sourceConfig: {
        subCategory: "variety_rating_rank1",
        metric: "nielsen_sunday_variety",
      },
    });

    // 4-4. K-POP 주간 음원 차트 (써클/멜론 TOP 10 신곡 진입)
    this.templates.push({
      id: "kcontent-kpop-chart-top10",
      title: "[K-POP 차트] 이번 주 신규 발매 음원, 주간 차트 TOP 10 진입 성공할까?",
      description:
        "이번 주 발매된 K-POP 컴백 신곡이 멜론/써클 주간 디지털 차트 10위권 내에 새롭게 진입(New Entry)할지 예측하세요.\n📅 마감: 일요일 18:00 | 🎵 정산: 월요일 12:00 주간 차트 발표",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "yes", label: "TOP 10 신곡 진입 성공 (Yes)", description: "주간 차트 1~10위 내 신곡 진입" },
        { id: "no", label: "기존 곡 TOP 10 수성 (No)", description: "신곡 10위권 진입 실패" },
      ],
      scheduledTime: this.getNextWeeklySchedule(1, 12), // 매주 월요일 12:00 오픈
      duration: 150, // 일요일 18:00 마감
      settlementDelay: 18, // 월요일 12:00 정산
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 3000,
      creatorId: systemUserId,
      category: "entertainment",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
      sourceType: "kcontent",
      sourceConfig: {
        subCategory: "music_chart_top10",
        chartSource: "circle_melon_weekly",
      },
    });
  }

  /**
   * 5. 글로벌 증시 & 암호화폐 정기 템플릿
   */
  private registerGlobalMarketTemplates(systemUserId: UserId): void {
    this.templates.push({
      id: "us-nasdaq-daily",
      title: "[미국증시] 오늘 밤 나스닥 100(QQQ) 전일 대비 상승 마감할까?",
      description:
        "미국 기술주 중심 나스닥 100 추종 ETF(QQQ)가 오늘 정규장 종가 기준 상승 마감할지 예측하세요.\n📅 마감: 미국 정규장 개장 1시간 전(21:30 KST) | 📈 정산: 장 마감 후 AlphaVantage API",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "up", label: "상승 마감 (Up)", description: "전일 종가 대비 상승" },
        { id: "down", label: "하락·보합 마감 (Down)", description: "전일 종가 대비 하락" },
      ],
      scheduledTime: this.getNextDailyUSMarketOpen(),
      duration: 1.5, // 20:00 오픈 -> 21:30 마감 (개장 1시간 전)
      settlementDelay: 8, // 익일 05:30 정산
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
        symbol: "QQQ",
        comparisonType: "price_change_direction",
        optionMapping: { up: "up", down: "down" },
      },
    });
  }

  private getNextDailyUSMarketOpen(): Date {
    const now = new Date();
    const result = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      20,
      0,
      0
    );
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  /**
   * 다음 주간 특정 요일(0:일 ~ 6:토) 및 시각 계산
   */
  private getNextWeeklySchedule(dayOfWeek: number, hour: number): Date {
    const now = new Date();
    const result = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      0,
      0
    );
    const diff = (dayOfWeek + 7 - result.getDay()) % 7;
    result.setDate(result.getDate() + diff);
    if (result <= now) {
      result.setDate(result.getDate() + 7);
    }
    return result;
  }

  private getNextMonthlySchedule(dayOfMonth: number, hour: number): Date {
    const now = new Date();
    const result = new Date(
      now.getFullYear(),
      now.getMonth(),
      dayOfMonth,
      hour,
      0,
      0
    );
    if (result <= now) {
      result.setMonth(result.getMonth() + 1);
    }
    return result;
  }

  private getNextQuarterlySchedule(dayOfMonth: number, hour: number): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const quarterStartMonths = [0, 3, 6, 9];

    let nextQuarterMonth = quarterStartMonths.find((m) => m > currentMonth);
    if (nextQuarterMonth === undefined) {
      nextQuarterMonth = 0;
    }

    const year =
      nextQuarterMonth === 0 && currentMonth >= 9
        ? now.getFullYear() + 1
        : now.getFullYear();

    return new Date(year, nextQuarterMonth, dayOfMonth, hour, 0, 0);
  }

  async startScheduling(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    setInterval(async () => {
      await this.checkAndCreateScheduledGames();
    }, 60 * 1000);

    setInterval(async () => {
      await this.createDynamicGames();
    }, 60 * 60 * 1000);
  }

  stopScheduling(): void {
    this.isRunning = false;
  }

  private async checkAndCreateScheduledGames(): Promise<void> {
    const now = new Date();

    for (const template of this.templates) {
      if (!template.isActive) continue;

      const timeDiff = Math.abs(
        now.getTime() - template.scheduledTime.getTime()
      );
      const shouldCreate = timeDiff <= 2 * 60 * 1000;

      if (shouldCreate) {
        await this.createGameFromTemplate(template);

        if (template.recurrence && template.recurrence !== "once") {
          this.updateTemplateSchedule(template);
        } else {
          template.isActive = false;
        }
      }
    }
  }

  /**
   * 템플릿으로부터 예측 게임을 생성하고, 동시에 settlement_sources에 오라클 스펙을 자동 등록
   */
  public async createGameFromTemplate(
    template: ScheduledGameTemplate
  ): Promise<string | null> {
    try {
      const now = new Date();
      const endTime = new Date(
        now.getTime() + template.duration * 60 * 60 * 1000
      );
      const settlementTime = new Date(
        endTime.getTime() + template.settlementDelay * 60 * 60 * 1000
      );

      const typeMap: Record<PredictionType, "binary" | "wdl" | "ranking"> = {
        [PredictionType.BINARY]: "binary",
        [PredictionType.WIN_DRAW_LOSE]: "wdl",
        [PredictionType.RANKING]: "ranking",
      };

      const result = await this.createGameUseCase.execute({
        title: template.title,
        description: template.description,
        predictionType: typeMap[template.predictionType] ?? "binary",
        options: template.options,
        startTime: now,
        endTime,
        settlementTime,
        creatorId: template.creatorId,
        minimumStake: template.minimumStake,
        maximumStake: template.maximumStake,
        maxParticipants: template.maxParticipants,
      });

      if (!result.success) {
        return null;
      }

      const createdGameId = String(result.data.gameId);

      // 오라클 설정이 있는 템플릿이면 settlement_sources 테이블에 100% 세트로 등록
      if (template.sourceType && template.sourceConfig) {
        await settlementOrchestrator.registerSettlementSource({
          gameId: createdGameId,
          sourceType: template.sourceType,
          sourceConfig: template.sourceConfig,
          scheduledAt: settlementTime,
          externalId: template.id,
        });
      }

      return createdGameId;
    } catch {
      return null;
    }
  }

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

  private async createDynamicGames(): Promise<void> {
    const currentHour = new Date().getHours();
    let gamesToCreate = this.config.gamesPerHour;

    if (this.config.peakHours.includes(currentHour)) {
      gamesToCreate = Math.ceil(gamesToCreate * 1.5);
    } else if (this.config.quietHours.includes(currentHour)) {
      gamesToCreate = Math.max(1, Math.ceil(gamesToCreate * 0.5));
    }

    for (let i = 0; i < gamesToCreate; i++) {
      await this.createDynamicGame(i, gamesToCreate);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  private async createDynamicGame(
    index: number,
    totalGames: number
  ): Promise<void> {
    void totalGames;
    const category =
      this.config.categoryRotation[index % this.config.categoryRotation.length];
    const difficulty = this.selectRandomDifficulty();
    const gameTemplate = this.generateDynamicGameTemplate(category, difficulty);

    if (gameTemplate) {
      await this.createGameFromTemplate(gameTemplate);
    }
  }

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

    return "medium";
  }

  private generateDynamicGameTemplate(
    category: string,
    difficulty: string
  ): ScheduledGameTemplate | null {
    const now = new Date();
    const templates = this.templates.filter((t) => t.category === category);

    if (templates.length === 0) return null;

    const baseTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    return {
      ...baseTemplate,
      id: `dynamic-${category}-${now.getTime()}`,
      scheduledTime: now,
      importance: difficulty as any,
      recurrence: "once",
    };
  }

  getActiveTemplates(): ScheduledGameTemplate[] {
    return this.templates.filter((t) => t.isActive);
  }

  addTemplate(template: ScheduledGameTemplate): void {
    this.templates.push(template);
  }

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

  private getNextScheduledTime(): Date | null {
    const activeTemplates = this.templates.filter((t) => t.isActive);
    if (activeTemplates.length === 0) return null;

    return activeTemplates.sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    )[0].scheduledTime;
  }
}
