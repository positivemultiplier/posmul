import { UserId } from "@posmul/auth-economy-sdk";
import type { PmpAmount } from "@posmul/auth-economy-sdk";

import type { GameOptions } from "../../domain/value-objects/prediction-types";
import { PredictionType } from "../../domain/value-objects/prediction-types";
import { SettlementSourceType } from "../../domain/value-objects/settlement-types";
import { CreatePredictionGameUseCase } from "../use-cases/create-prediction-game.use-case";
import { settlementOrchestrator } from "./settlement-orchestrator.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** 한국 표준시(KST) UTC 오프셋 (분) */
const KST_OFFSET_MINUTES = 9 * 60;

/** 템플릿 카테고리 → DB prediction_category enum */
const TEMPLATE_CATEGORY_TO_DB: Record<ScheduledGameTemplate["category"], string> = {
  sports: "SPORTS",
  politics: "POLITICS",
  economy: "ECONOMY",
  entertainment: "ENTERTAINMENT",
  weather: "USER_PROPOSED",
  technology: "INVEST",
};

/** 도메인 PredictionType → DB prediction_type enum */
const PREDICTION_TYPE_TO_DB: Record<PredictionType, string> = {
  [PredictionType.BINARY]: "BINARY",
  [PredictionType.WIN_DRAW_LOSE]: "WIN_DRAW_LOSE",
  [PredictionType.RANKING]: "RANKING",
};

/** 중요도 → 난이도(1.0~5.0) */
const IMPORTANCE_TO_DIFFICULTY: Record<ScheduledGameTemplate["importance"], number> = {
  low: 1.5,
  medium: 2.5,
  high: 3.5,
  critical: 4.5,
};

/** 카테고리 페이지 필터(서브카테고리)에 맞춰 템플릿 서브카테고리 결정 */
function resolveTemplateSubcategory(template: ScheduledGameTemplate): string | null {
  switch (template.sourceType) {
    case "ecos":
    case "kosis":
      return template.category === "technology" ? "retail" : "indicators";
    case "dart":
    case "fmp":
      return "earnings";
    case "alpha-vantage":
      return "stocks";
    case "coingecko":
      return "crypto";
    case "football_data":
      return "soccer";
    case "kobis":
      return "movie";
    case "kcontent": {
      const sub = String(template.sourceConfig?.subCategory ?? "");
      if (sub.startsWith("drama") || sub.startsWith("ott")) return "drama";
      if (sub.startsWith("variety")) return "variety";
      if (sub.startsWith("music")) return "music";
      return null;
    }
    default: {
      if (template.category === "sports") {
        if (template.id.includes("kbo") || template.id.includes("baseball")) return "baseball";
        if (template.id.includes("lck") || template.id.includes("esports")) return "esports";
        return "soccer";
      }
      if (template.category === "politics") return "legislation";
      if (template.category === "technology") return "retail";
      return null;
    }
  }
}

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
    this.registerSportsTemplates(systemUserId);
    this.registerPoliticsAndInvestTemplates(systemUserId);
    this.registerRankingTemplates(systemUserId);
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

    // 4-5. OTT 한국 드라마 넷플릭스 주간 TOP 10 1위 달성 예측
    this.templates.push({
      id: "kcontent-ott-netflix-top1",
      title: "[OTT·드라마] 금주 화제작 한국 드라마, 넷플릭스 한국 TOP 10 1위 수성할까?",
      description:
        "주말 방영 및 공개 직후 한국 넷플릭스 시리즈 TOP 10 공식 순위(Tudum / FlixPatrol 집계)에서 한국 드라마가 1위를 차지할지 예측하세요.\n📅 마감: 일요일 21:00 | 📺 정산: 월요일 11:00 공식 순위 집계",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "yes", label: "한국 드라마 1위 수성 (Yes)", description: "넷플릭스 한국 시리즈 1위" },
        { id: "no", label: "해외 시리즈·예능 1위 (No)", description: "1위 수성 실패" },
      ],
      scheduledTime: this.getNextWeeklySchedule(4, 12),
      duration: 81,
      settlementDelay: 14,
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
        subCategory: "ott_top1",
        metric: "netflix_kr_series_top10",
        optionMapping: { above: "yes", below: "no" },
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

    this.templates.push({
      id: "btc-weekly-target",
      title: "[암호화폐] 비트코인(BTC) 이번 주 $95,000 돌파할까?",
      description:
        "글로벌 현물 ETF 자금 유입과 거시 유동성 흐름 속에서 비트코인(BTC) 시세가 이번 주 마감 기준 $95,000를 돌파할지 예측하세요.\n📅 마감: 일요일 23:00 | ₿ 정산: CoinGecko 글로벌 인덱스 실시간 API",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "yes", label: "$95,000 돌파 (Yes)", description: "BTC ≥ $95,000" },
        { id: "no", label: "$95,000 미달 (No)", description: "BTC < $95,000" },
      ],
      scheduledTime: this.getNextWeeklySchedule(1, 9),
      duration: 158,
      settlementDelay: 1,
      minimumStake: 500 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 5000,
      creatorId: systemUserId,
      category: "economy",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
      sourceType: "coingecko",
      sourceConfig: {
        coinId: "bitcoin",
        vsCurrency: "usd",
        comparisonType: "threshold",
        threshold: 95000,
        optionMapping: { above: "yes", below: "no" },
      },
    });
  }

  /**
   * 6. 스포츠 승무패(WIN_DRAW_LOSE) 및 리그 템플릿
   */
  private registerSportsTemplates(systemUserId: UserId): void {
    // 6-1. EPL 주간 빅매치 승무패 (WIN_DRAW_LOSE 3지선다)
    this.templates.push({
      id: "sports-epl-bigmatch-wdl",
      title: "[프리미어리그] 이번 주 EPL 빅매치 맞대결 최종 승무패 결과는?",
      description:
        "잉글랜드 프리미어리그(EPL) 이번 라운드 최고 빅매치의 정규시간 90분 승무패 결과를 예측하세요.\n📅 마감: 주말 경기 킥오프 1시간 전 | ⚽ 정산: Football-Data 공식 경기 결과 API",
      predictionType: PredictionType.WIN_DRAW_LOSE,
      options: [
        { id: "win", label: "홈팀 승리 (Win)", description: "정규시간 홈팀 승리" },
        { id: "draw", label: "무승부 (Draw)", description: "90분 정규시간 무승부" },
        { id: "lose", label: "원정팀 승리 (Lose)", description: "정규시간 원정팀 승리" },
      ],
      scheduledTime: this.getNextWeeklySchedule(2, 10, 96),
      duration: 96,
      settlementDelay: 3,
      minimumStake: 1000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 4000,
      creatorId: systemUserId,
      category: "sports",
      importance: "critical",
      recurrence: "weekly",
      isActive: true,
      sourceType: "football_data",
      sourceConfig: {
        competition: "PL",
        market: "1X2",
        optionMapping: { HOME_TEAM: "win", DRAW: "draw", AWAY_TEAM: "lose" },
      },
    });

    // 6-2. e스포츠 LCK 빅매치 세트 스코어 3지선다 (WIN_DRAW_LOSE)
    this.templates.push({
      id: "sports-lck-bigmatch-wdl",
      title: "[LCK·e스포츠] 이번 주 LCK 빅매치 상위 시드팀 세트별 승리 양상은?",
      description:
        "LoL 챔피언스 코리아(LCK) 주요 빅매치에서 탑 시드 팀이 2:0 완승, 2:1 신승, 또는 업셋 패배 중 어떤 결과를 만들지 예측하세요.\n📅 마감: 경기 시작 1시간 전 | 🎮 정산: LCK 공식 매치 데이터",
      predictionType: PredictionType.WIN_DRAW_LOSE,
      options: [
        { id: "2_0", label: "상위 시드 2:0 완승", description: "압도적 세트 스윕" },
        { id: "2_1", label: "2:1 풀세트 접전 승", description: "풀세트 혈투 끝 승리" },
        { id: "upset", label: "언더독 업셋 승리", description: "하위 시드팀 이변 승리" },
      ],
      scheduledTime: this.getNextWeeklySchedule(3, 12, 72),
      duration: 72,
      settlementDelay: 4,
      minimumStake: 500 as PmpAmount,
      maximumStake: 80000 as PmpAmount,
      maxParticipants: 3500,
      creatorId: systemUserId,
      category: "sports",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
      sourceType: "manual",
    });

    // 6-3. 국내 프로야구·축구 주간 다득점 돌파 (BINARY)
    this.templates.push({
      id: "sports-k-league-scoring-binary",
      title: "[K리그·프로스포츠] 이번 주말 주요 빅매치 양팀 합산 3득점 이상 다득점 나올까?",
      description:
        "이번 주말 펼쳐지는 K리그·국내 프로스포츠 대표 라운드 매치에서 공격적인 다득점 경기가 나올지 예측하세요.\n📅 마감: 토요일 13:00 | 🏟️ 정산: 경기 종료 후 공식 스코어보드",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "yes", label: "3득점 이상 오버 (Yes)", description: "합산 득점 ≥ 3" },
        { id: "no", label: "2득점 이하 언더 (No)", description: "합산 득점 ≤ 2" },
      ],
      scheduledTime: this.getNextWeeklySchedule(3, 10, 75),
      duration: 75,
      settlementDelay: 3,
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 2500,
      creatorId: systemUserId,
      category: "sports",
      importance: "medium",
      recurrence: "weekly",
      isActive: true,
      sourceType: "manual",
    });
  }

  /**
   * 7. 정치·입법(POLITICS) 및 소비·투자 트렌드(INVEST) 템플릿
   */
  private registerPoliticsAndInvestTemplates(systemUserId: UserId): void {
    // 7-1. 국회 본회의 주요 민생·경제 법안 통과 여부 (BINARY)
    this.templates.push({
      id: "politics-assembly-bill-binary",
      title: "[국회 본회의] 이번 주 상정된 핵심 민생·경제 법안 원안 가결 통과될까?",
      description:
        "국회 본회의 표결에 부쳐지는 주요 경제·민생 지원 법안이 재석의원 과반 찬성으로 가결될지 예측하세요.\n📅 마감: 본회의 개회 1시간 전 | 🏛️ 정산: 국회 열린국회정보 공식 의결 공시",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "yes", label: "원안·수정안 가결 (Yes)", description: "본회의 과반 찬성 통과" },
        { id: "no", label: "보류·부결 (No)", description: "상정 보류 또는 부결" },
      ],
      scheduledTime: this.getNextWeeklySchedule(1, 9, 102),
      duration: 102,
      settlementDelay: 6,
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 3000,
      creatorId: systemUserId,
      category: "politics",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
      sourceType: "manual",
    });

    // 7-2. 주간 정례 경제정책 여론 평가 3지선다 (WIN_DRAW_LOSE)
    this.templates.push({
      id: "politics-economic-policy-wdl",
      title: "[국정·정책] 차기 주간 정례 경제정책 여론 평가 방향성은?",
      description:
        "주요 여론조사 기관의 차기 주간 정례 경제·민생 정책 평가에서 전주 대비 어떤 흐름이 우세할지 예측하세요.\n📅 마감: 목요일 18:00 | 📊 정산: 금요일 10:00 공식 여론조사 공표",
      predictionType: PredictionType.WIN_DRAW_LOSE,
      options: [
        { id: "positive", label: "긍정 평가 우세", description: "전주 대비 긍정 응답 상승" },
        { id: "neutral", label: "보합·오차범위 혼전", description: "±1.5%p 이내 횡보" },
        { id: "negative", label: "부정 평가 우세", description: "전주 대비 부정 응답 확대" },
      ],
      scheduledTime: this.getNextWeeklySchedule(1, 10, 80),
      duration: 80,
      settlementDelay: 16,
      minimumStake: 500 as PmpAmount,
      maximumStake: 40000 as PmpAmount,
      maxParticipants: 2500,
      creatorId: systemUserId,
      category: "politics",
      importance: "medium",
      recurrence: "weekly",
      isActive: true,
      sourceType: "manual",
    });
  }

  /**
   * 8. 다자선택 순위 경쟁(RANKING) 전 카테고리 전용 템플릿
   */
  private registerRankingTemplates(systemUserId: UserId): void {
    // 8-1. [경제] 글로벌·국내 자산군 주간 수익률 1위 (RANKING 5지선다)
    this.templates.push({
      id: "ranking-global-asset-weekly",
      title: "[자산군 대전] 이번 주 주요 투자 자산군 중 주간 수익률 1위는?",
      description:
        "금주 글로벌 금융시장에서 미국 기술주(QQQ), 코스피 대형주, 비트코인(BTC), 국제 금(Gold), 장기 미 국채 중 가장 높은 주간 수익률을 기록할 자산을 예측하세요.\n📅 마감: 금요일 20:00 | 📈 정산: 주말 AlphaVantage·CoinGecko 종가 집계",
      predictionType: PredictionType.RANKING,
      options: [
        { id: "qqq", label: "미국 빅테크 (QQQ)", description: "나스닥 100 기술주 ETF" },
        { id: "btc", label: "비트코인 (BTC)", description: "글로벌 가상자산 대장주" },
        { id: "kospi", label: "코스피 대형주 (KOSPI)", description: "국내 반도체·수출 대표주" },
        { id: "gold", label: "국제 금 (Gold)", description: "안전자산 실물 ETF" },
        { id: "bond", label: "미 장기 국채 (TLT)", description: "금리 인하 수혜 채권" },
      ],
      scheduledTime: this.getNextWeeklySchedule(1, 9, 107),
      duration: 107,
      settlementDelay: 12,
      minimumStake: 1000 as PmpAmount,
      maximumStake: 100000 as PmpAmount,
      maxParticipants: 4000,
      creatorId: systemUserId,
      category: "economy",
      importance: "critical",
      recurrence: "weekly",
      isActive: true,
      sourceType: "alpha-vantage",
      sourceConfig: {
        symbols: ["QQQ", "GLD", "TLT"],
        market: "multi_asset_weekly_rank1",
      },
    });

    // 8-2. [K-POP] 주간 음원 차트 1위 진영 경쟁 (RANKING 4지선다)
    this.templates.push({
      id: "ranking-kpop-chart-weekly",
      title: "[K-POP 랭킹] 이번 주 멜론·써클 주간 디지털 차트 1위 진영은?",
      description:
        "이번 주 국내 음원 스트리밍 주간 종합 차트에서 1위 왕좌를 차지할 아티스트 진영을 예측하세요.\n📅 마감: 일요일 18:00 | 🎵 정산: 월요일 12:00 주간 차트 공식 발표",
      predictionType: PredictionType.RANKING,
      options: [
        { id: "girlgroup", label: "4·5세대 걸그룹", description: "메이저 걸그룹 타이틀곡" },
        { id: "solo", label: "솔로 음원 강자", description: "여성·남성 솔로 대표곡" },
        { id: "boygroup", label: "글로벌 보이그룹", description: "코어 팬덤 화력 음원" },
        { id: "ost_band", label: "밴드·OST·역주행", description: "드라마 OST 및 밴드 록" },
      ],
      scheduledTime: this.getNextWeeklySchedule(1, 10, 152),
      duration: 152,
      settlementDelay: 18,
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 3500,
      creatorId: systemUserId,
      category: "entertainment",
      importance: "high",
      recurrence: "weekly",
      isActive: true,
      sourceType: "kcontent",
      sourceConfig: {
        subCategory: "music_chart_rank1",
        chartSource: "circle_melon_weekly",
      },
    });

    // 8-3. [극장가] 주말 박스오피스 1위 장르군 경쟁 (RANKING 4지선다)
    this.templates.push({
      id: "ranking-boxoffice-weekend",
      title: "[극장가 랭킹] 이번 주말 KOBIS 박스오피스 관객수 1위 작품군은?",
      description:
        "금·토·일 사흘간 영화진흥위원회 통합전산망(KOBIS) 주말 박스오피스에서 관객수 1위를 차지할 영화 장르·배급군을 예측하세요.\n📅 마감: 금요일 17:00 | 🎬 정산: 월요일 09:00 KOBIS 공식 집계",
      predictionType: PredictionType.RANKING,
      options: [
        { id: "kr_action", label: "한국 액션·범죄 대작", description: "국내 텐트폴 배급작" },
        { id: "hollywood", label: "할리우드 블록버스터", description: "메이저 스튜디오 외화" },
        { id: "animation", label: "가족·일본 애니메이션", description: "가족 관객 & 팬덤 애니" },
        { id: "kr_drama", label: "한국 로맨스·스릴러", description: "입소문 흥행 한국 영화" },
      ],
      scheduledTime: this.getNextWeeklySchedule(2, 10, 79),
      duration: 79,
      settlementDelay: 64,
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
        mode: "weekend_rank1_group",
        periodType: "weekend",
      },
    });

    // 8-4. [소비·트렌드(INVEST)] 월간 온라인 소비지출 증가율 1위 품목군 (RANKING 4지선다)
    this.templates.push({
      id: "ranking-invest-consumer-trend",
      title: "[소비·트렌드] 이번 달 온라인 소비지출 전년비 증가율 1위 품목군은?",
      description:
        "통계청 온라인쇼핑동향 공식 통계에서 이번 달 전년 동월 대비 거래액 성장률 1위를 기록할 소비 품목군을 예측하세요.\n📅 마감: 월말 18:00 | 📊 정산: 통계청 KOSIS 온라인쇼핑동향 공표",
      predictionType: PredictionType.RANKING,
      options: [
        { id: "ai_tech", label: "AI·디지털 가전", description: "스마트 기기·PC·가전 구독" },
        { id: "travel", label: "해외여행·항공/숙박", description: "여행 및 교통 예약 서비스" },
        { id: "food_wellness", label: "음식서비스·웰니스", description: "프리미엄 식품·배달·헬스" },
        { id: "fashion_living", label: "패션·뷰티 리빙", description: "온라인 패션·화장품·생활용품" },
      ],
      scheduledTime: this.getNextMonthlySchedule(1, 9, 480),
      duration: 480,
      settlementDelay: 72,
      minimumStake: 1000 as PmpAmount,
      maximumStake: 60000 as PmpAmount,
      maxParticipants: 2500,
      creatorId: systemUserId,
      category: "technology",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "kosis",
      sourceConfig: {
        subCategory: "retail",
        indicatorCode: "ONLINE_SHOPPING_GROWTH_RANK1",
      },
    });

    // 8-5. [스포츠] 월간 글로벌·국내 스포츠 리그 화제성 1위 (RANKING 4지선다)
    this.templates.push({
      id: "ranking-sports-league-monthly",
      title: "[스포츠 랭킹] 이번 달 국내외 팬덤 참여·화제성 1위 스포츠 리그는?",
      description:
        "이번 달 PosMul 스포츠 팬덤 참여와 주요 경기 이슈를 주도할 최고 인기 리그 1위를 예측하세요.\n📅 마감: 월말 20:00 | 🏆 정산: 월간 결산 집계",
      predictionType: PredictionType.RANKING,
      options: [
        { id: "epl", label: "프리미어리그 (EPL)", description: "유럽 축구 최고 인기 리그" },
        { id: "kbo_kl", label: "KBO·K리그 국내 프로", description: "국내 프로야구 및 K리그" },
        { id: "lck", label: "LCK e스포츠", description: "글로벌 LoL 챔피언스 리그" },
        { id: "nba_mlb", label: "NBA · MLB 북미리그", description: "북미 4대 메이저 스포츠" },
      ],
      scheduledTime: this.getNextMonthlySchedule(1, 10, 480),
      duration: 480,
      settlementDelay: 24,
      minimumStake: 500 as PmpAmount,
      maximumStake: 50000 as PmpAmount,
      maxParticipants: 3000,
      creatorId: systemUserId,
      category: "sports",
      importance: "high",
      recurrence: "monthly",
      isActive: true,
      sourceType: "manual",
    });
  }

  /** KST 기준 현재 연·월·일·요일·시 추출 (UTC/로컬 타임존 무관) */
  private getKstNowParts() {
    const kstNow = new Date(Date.now() + KST_OFFSET_MINUTES * 60 * 1000);
    return {
      year: kstNow.getUTCFullYear(),
      month: kstNow.getUTCMonth(),
      day: kstNow.getUTCDate(),
      dayOfWeek: kstNow.getUTCDay(),
      hour: kstNow.getUTCHours(),
    };
  }

  /** KST 벽시계(year, month, day, hour)를 정확한 UTC Date 객체로 변환 */
  private kstWallTimeToUtc(
    year: number,
    month: number,
    day: number,
    hour: number
  ): Date {
    return new Date(Date.UTC(year, month, day, hour - 9, 0, 0));
  }

  private getNextDailyUSMarketOpen(): Date {
    const now = Date.now();
    const { year, month, day } = this.getKstNowParts();
    const todayOpen = this.kstWallTimeToUtc(year, month, day, 20);
    // US 정규장 개장 1시간 전(21:30 KST)까지 최소 1시간 여유가 있으면 오늘 회차 사용
    const todayCloseMs = todayOpen.getTime() + 1.5 * 60 * 60 * 1000;
    if (todayCloseMs > now + 60 * 60 * 1000) {
      return todayOpen;
    }
    return this.kstWallTimeToUtc(year, month, day + 1, 20);
  }

  /**
   * 현재 진행 중인 주간 회차(아직 마감 2시간 초과 남음) 또는 차기 주간 회차 반환
   */
  private getNextWeeklySchedule(
    dayOfWeek: number,
    hour: number,
    durationHours: number = 120
  ): Date {
    const nowMs = Date.now();
    const minBufferMs = 2 * 60 * 60 * 1000;
    const durationMs = durationHours * 60 * 60 * 1000;
    const { year, month, day, dayOfWeek: currentDow } = this.getKstNowParts();

    const candidate = this.kstWallTimeToUtc(
      year,
      month,
      day + (dayOfWeek - currentDow),
      hour
    );

    if (candidate.getTime() > nowMs) {
      const prevWeek = new Date(candidate.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (prevWeek.getTime() + durationMs > nowMs + minBufferMs) {
        return prevWeek;
      }
      return candidate;
    }

    if (candidate.getTime() + durationMs > nowMs + minBufferMs) {
      return candidate;
    }
    return new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * 현재 진행 중인 월간 회차(아직 마감 2시간 초과 남음) 또는 차기 월간 회차 반환
   */
  private getNextMonthlySchedule(
    dayOfMonth: number,
    hour: number,
    durationHours: number = 240
  ): Date {
    const nowMs = Date.now();
    const minBufferMs = 2 * 60 * 60 * 1000;
    const durationMs = durationHours * 60 * 60 * 1000;
    const { year, month } = this.getKstNowParts();

    const candidate = this.kstWallTimeToUtc(year, month, dayOfMonth, hour);
    if (candidate.getTime() > nowMs) {
      const prevMonth = this.kstWallTimeToUtc(year, month - 1, dayOfMonth, hour);
      if (prevMonth.getTime() + durationMs > nowMs + minBufferMs) {
        return prevMonth;
      }
      return candidate;
    }

    if (candidate.getTime() + durationMs > nowMs + minBufferMs) {
      return candidate;
    }
    return this.kstWallTimeToUtc(year, month + 1, dayOfMonth, hour);
  }

  private getNextQuarterlySchedule(dayOfMonth: number, hour: number): Date {
    const { year, month } = this.getKstNowParts();
    const quarterStartMonths = [0, 3, 6, 9];

    let nextQuarterMonth = quarterStartMonths.find((m) => m > month);
    if (nextQuarterMonth === undefined) {
      nextQuarterMonth = 0;
    }

    const targetYear =
      nextQuarterMonth === 0 && month >= 9 ? year + 1 : year;

    return this.kstWallTimeToUtc(targetYear, nextQuarterMonth, dayOfMonth, hour);
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
      const HOUR_MS = 60 * 60 * 1000;

      // scheduledTime은 이미 정확한 UTC epoch 타임스탬프(KST 벽시계 기준 변환 완료)
      const openAt = template.scheduledTime;
      const endTime = new Date(openAt.getTime() + template.duration * HOUR_MS);
      const settlementTime = new Date(
        endTime.getTime() + template.settlementDelay * HOUR_MS
      );

      // 마감까지 1시간도 남지 않은 회차는 생성하지 않음 (다음 회차에서 생성)
      if (endTime.getTime() <= now.getTime() + HOUR_MS) {
        return null;
      }

      // 회차별 고유 slug (템플릿 ID + 마감일 KST) → 과거 CLOSED/CANCELLED와 충돌 시 시간 suffix 부여
      const kstNowForSlug = new Date(now.getTime() + KST_OFFSET_MINUTES * 60 * 1000);
      const closeDateKst = new Date(endTime.getTime() + KST_OFFSET_MINUTES * 60 * 1000)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const baseSlug = `${template.id}-${closeDateKst}`;

      // 1. 동일 템플릿(external_id)이 이미 ACTIVE 상태면 중복 생성 원천 차단 (멱등성)
      const { data: activeExisting } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id")
        .eq("external_id", template.id)
        .eq("status", "ACTIVE")
        .limit(1)
        .maybeSingle();
      if (activeExisting) {
        return null;
      }

      // 2. 과거 CLOSED/CANCELLED 이력이 같은 baseSlug를 점유 중이면 고유 suffix 부여
      const { data: slugExisting } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id")
        .eq("slug", baseSlug)
        .limit(1)
        .maybeSingle();
      const timeTag = kstNowForSlug.toISOString().slice(11, 16).replace(":", "");
      const slug = slugExisting ? `${baseSlug}-r${timeTag}` : baseSlug;

      const hasOracleAdapter =
        !!template.sourceType && template.sourceType !== "manual";

      // 크론에는 로그인 사용자가 없으므로(RLS 차단) 서비스 롤로 직접 저장
      const { data: inserted, error } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .insert({
          creator_id: String(template.creatorId),
          title: template.title,
          description: template.description,
          category: TEMPLATE_CATEGORY_TO_DB[template.category] ?? "ECONOMY",
          subcategory: resolveTemplateSubcategory(template),
          prediction_type: PREDICTION_TYPE_TO_DB[template.predictionType] ?? "BINARY",
          game_options: { options: template.options },
          difficulty: IMPORTANCE_TO_DIFFICULTY[template.importance] ?? 2.5,
          min_bet_amount: Number(template.minimumStake),
          max_bet_amount: Number(template.maximumStake),
          registration_start: now.toISOString(),
          registration_end: endTime.toISOString(),
          settlement_date: settlementTime.toISOString(),
          status: "ACTIVE",
          slug,
          is_official: true,
          settlement_type: hasOracleAdapter ? "auto" : "manual",
          data_source: template.sourceType ?? null,
          external_id: template.id,
          tags: [template.category, template.sourceType ?? "manual"],
          metadata: {
            templateId: template.id,
            maxParticipants: template.maxParticipants,
            recurrence: template.recurrence ?? "once",
            importance: template.importance,
          },
        })
        .select("game_id")
        .single();

      if (error || !inserted) {
        console.error(
          `[GameScheduling] 템플릿 게임 생성 실패 (${template.id}):`,
          error?.message
        );
        return null;
      }

      const createdGameId = String(inserted.game_id);

      // 오라클 어댑터가 있는 템플릿이면 settlement_sources 테이블에 등록 (자동 정산 대상)
      if (hasOracleAdapter && template.sourceType && template.sourceConfig) {
        await settlementOrchestrator.registerSettlementSource({
          gameId: createdGameId,
          sourceType: template.sourceType,
          sourceConfig: template.sourceConfig,
          scheduledAt: settlementTime,
          externalId: template.id,
        });
      }

      // MoneyWave 시간당 게임별 상금풀 즉시 재분배 연동
      try {
        await supabaseAdmin
          .schema("economy")
          .rpc("compute_prediction_hourly_game_pools");
      } catch {
        // RPC 미노출/일시 오류 시 다음 정시 크론에서 자동 계산되므로 게임 생성 성공 유지
      }

      return createdGameId;
    } catch (err) {
      console.error(`[GameScheduling] 템플릿 게임 생성 예외 (${template.id}):`, err);
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
