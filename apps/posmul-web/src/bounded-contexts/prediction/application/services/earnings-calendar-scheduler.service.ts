/**
 * FMP Earnings Calendar 기반 분기 실적 발표 자동 게임 생성 서비스
 * 
 * 지원 기능:
 * - 예정된 실적 발표 일정 조회
 * - 주요 기업 EPS 예측 게임 자동 생성
 * - 한국/미국 기업 모두 지원
 */

import type { PmpAmount, UserId } from "@posmul/auth-economy-sdk";
import { PredictionType } from "../../domain/value-objects/prediction-types";
import type { ScheduledGameTemplate } from "../services/game-scheduling.service";

// FMP Earnings Calendar API 응답 타입
interface FmpEarningsEvent {
    date: string;
    symbol: string;
    eps: number | null;         // 예상 EPS
    epsEstimated: number | null; // 애널리스트 예상 EPS
    time: "bmo" | "amc" | string; // Before Market Open / After Market Close
    revenue: number | null;
    revenueEstimated: number | null;
}

// 주요 관심 기업 목록 (한국어 이름 포함)
const TRACKED_COMPANIES: Record<string, { name: string; category: "technology" | "economy"; importance: "high" | "critical" }> = {
    // 미국 빅테크
    AAPL: { name: "애플", category: "technology", importance: "critical" },
    MSFT: { name: "마이크로소프트", category: "technology", importance: "critical" },
    GOOGL: { name: "구글(알파벳)", category: "technology", importance: "critical" },
    AMZN: { name: "아마존", category: "technology", importance: "critical" },
    NVDA: { name: "엔비디아", category: "technology", importance: "critical" },
    META: { name: "메타", category: "technology", importance: "high" },
    TSLA: { name: "테슬라", category: "technology", importance: "critical" },

    // 미국 금융/기타
    JPM: { name: "JP모건", category: "economy", importance: "high" },
    BAC: { name: "뱅크오브아메리카", category: "economy", importance: "high" },
    WMT: { name: "월마트", category: "economy", importance: "high" },

    // 반도체
    AMD: { name: "AMD", category: "technology", importance: "high" },
    INTC: { name: "인텔", category: "technology", importance: "high" },
};

export class EarningsCalendarSchedulerService {
    private readonly apiKey: string;
    private readonly baseUrl = "https://financialmodelingprep.com/api/v3";
    private readonly systemUserId: UserId;

    constructor() {
        const apiKey = process.env.FMP_API_KEY;
        if (!apiKey) {
            throw new Error("FMP_API_KEY is not set");
        }
        this.apiKey = apiKey;
        this.systemUserId = "system-scheduler" as UserId;
    }

    /**
     * 특정 기간의 실적 발표 일정 조회
     */
    async fetchEarningsCalendar(
        from: Date,
        to: Date
    ): Promise<FmpEarningsEvent[]> {
        try {
            const fromStr = from.toISOString().split("T")[0];
            const toStr = to.toISOString().split("T")[0];

            const url = `${this.baseUrl}/earning_calendar?from=${fromStr}&to=${toStr}&apikey=${this.apiKey}`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[EarningsScheduler] API error: ${response.status}`);
                return [];
            }

            const data: FmpEarningsEvent[] = await response.json();

            // 관심 기업만 필터링
            return data.filter(event =>
                Object.keys(TRACKED_COMPANIES).includes(event.symbol)
            );
        } catch (error) {
            console.error("[EarningsScheduler] Fetch error:", error);
            return [];
        }
    }

    /**
     * 이번 주 실적 발표 일정 조회
     */
    async fetchWeeklyEarnings(): Promise<FmpEarningsEvent[]> {
        const from = new Date();
        const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return this.fetchEarningsCalendar(from, to);
    }

    /**
     * 이번 달 실적 발표 일정 조회
     */
    async fetchMonthlyEarnings(): Promise<FmpEarningsEvent[]> {
        const from = new Date();
        const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return this.fetchEarningsCalendar(from, to);
    }

    /**
     * 실적 발표 이벤트를 게임 템플릿으로 변환
     */
    convertEarningsToTemplate(event: FmpEarningsEvent): ScheduledGameTemplate | null {
        const companyInfo = TRACKED_COMPANIES[event.symbol];
        if (!companyInfo) {
            return null;
        }

        const earningsDate = new Date(event.date);

        // 실적 발표 7일 전부터 게임 시작
        const scheduledTime = new Date(earningsDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 실적 발표 시점까지 참여 가능
        const duration = 7 * 24; // 7일 (시간 단위)

        // 실적 발표 24시간 후 정산
        const settlementDelay = 24;

        // EPS 예상치 기준 임계값 설정
        const epsEstimate = event.epsEstimated ?? event.eps ?? 0;

        // EPS가 없으면 생성하지 않음
        if (epsEstimate === 0) {
            console.log(`[EarningsScheduler] No EPS estimate for ${event.symbol}, skipping`);
            return null;
        }

        return {
            id: `earnings-${event.symbol}-${event.date}`,
            title: `${companyInfo.name}(${event.symbol}) 분기 실적 예측`,
            description: `${companyInfo.name}의 이번 분기 실적이 애널리스트 예상(EPS $${epsEstimate.toFixed(2)})을 상회할까요?\n\n📅 실적 발표: ${event.date}\n⏰ 발표 시점: ${event.time === 'bmo' ? '장 시작 전' : event.time === 'amc' ? '장 마감 후' : event.time}`,
            predictionType: PredictionType.BINARY,
            options: [
                {
                    id: "beat",
                    label: "예상 상회 (Beat)",
                    description: `EPS > $${epsEstimate.toFixed(2)}`
                },
                {
                    id: "miss",
                    label: "예상 하회 (Miss)",
                    description: `EPS ≤ $${epsEstimate.toFixed(2)}`
                },
            ],
            scheduledTime,
            duration,
            settlementDelay,
            minimumStake: 2000 as PmpAmount,
            maximumStake: this.getMaxStakeByImportance(companyInfo.importance),
            maxParticipants: companyInfo.importance === "critical" ? 5000 : 2000,
            creatorId: this.systemUserId,
            category: companyInfo.category,
            importance: companyInfo.importance,
            recurrence: "once",
            isActive: true,
            sourceType: "fmp",
            sourceConfig: {
                symbol: event.symbol,
                period: "quarter",
                accountName: "eps",
                comparisonType: "greater",
                threshold: epsEstimate,
                earningsDate: event.date,
                optionMapping: {
                    above: "beat",
                    below: "miss",
                },
            },
        };
    }

    /**
     * 중요도별 최대 스테이크 설정
     */
    private getMaxStakeByImportance(
        importance: "high" | "critical"
    ): PmpAmount {
        return (importance === "critical" ? 200000 : 100000) as PmpAmount;
    }

    /**
     * 이번 주 실적 발표에 대해 게임 템플릿 생성
     */
    async generateWeeklyEarningsGames(): Promise<ScheduledGameTemplate[]> {
        const events = await this.fetchWeeklyEarnings();
        const templates: ScheduledGameTemplate[] = [];

        for (const event of events) {
            const template = this.convertEarningsToTemplate(event);
            if (template) {
                templates.push(template);
            }
        }

        return templates;
    }

    /**
     * 이번 달 실적 발표에 대해 게임 템플릿 생성
     */
    async generateMonthlyEarningsGames(): Promise<ScheduledGameTemplate[]> {
        const events = await this.fetchMonthlyEarnings();
        const templates: ScheduledGameTemplate[] = [];

        for (const event of events) {
            const template = this.convertEarningsToTemplate(event);
            if (template) {
                templates.push(template);
            }
        }

        return templates;
    }

    /**
     * 특정 기업의 다음 실적 발표 조회
     */
    async getNextEarningsForSymbol(symbol: string): Promise<FmpEarningsEvent | null> {
        const events = await this.fetchMonthlyEarnings();
        return events.find(e => e.symbol === symbol) ?? null;
    }
}

// 사용 예시:
// const scheduler = new EarningsCalendarSchedulerService();
// const templates = await scheduler.generateWeeklyEarningsGames();
// for (const template of templates) {
//   gameSchedulingService.addTemplate(template);
// }
