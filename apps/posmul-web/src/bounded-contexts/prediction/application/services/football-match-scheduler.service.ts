/**
 * Football Data API 기반 경기 일정 조회 및 자동 게임 생성 서비스
 * 
 * 지원 리그:
 * - PL: Premier League
 * - CL: UEFA Champions League
 * - BL1: Bundesliga
 * - SA: Serie A
 * - PD: La Liga
 * - FL1: Ligue 1
 */

import type { PmpAmount, UserId } from "@posmul/auth-economy-sdk";
import { PredictionType } from "../../domain/value-objects/prediction-types";
import type { ScheduledGameTemplate } from "../services/game-scheduling.service";

// Football Data API 응답 타입
interface FootballDataMatch {
    id: number;
    utcDate: string;
    status: "SCHEDULED" | "LIVE" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "CANCELLED";
    matchday: number;
    competition: {
        id: number;
        name: string;
        code: string;
    };
    homeTeam: {
        id: number;
        name: string;
        shortName: string;
        crest: string;
    };
    awayTeam: {
        id: number;
        name: string;
        shortName: string;
        crest: string;
    };
    score: {
        fullTime: {
            home: number | null;
            away: number | null;
        };
        winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    };
}

interface FootballDataMatchesResponse {
    matches: FootballDataMatch[];
    resultSet: {
        count: number;
        first: string;
        last: string;
    };
}

// 리그 코드별 한글 이름
const LEAGUE_NAMES: Record<string, string> = {
    PL: "프리미어리그",
    CL: "챔피언스리그",
    BL1: "분데스리가",
    SA: "세리에A",
    PD: "라리가",
    FL1: "리그앙",
    EC: "유로파컵",
    WC: "월드컵",
};

// 주요 빅 4리그 우선 조회 (Football-Data 무료 플랜 10 req/min 및 크론 타임아웃 방지)
const SUPPORTED_LEAGUES = ["PL", "CL", "BL1", "PD"];

const SYSTEM_SCHEDULER_USER_ID =
    "00000000-0000-0000-0000-000000000001" as UserId;

export class FootballMatchSchedulerService {
    private readonly apiKey: string;
    private readonly baseUrl = "https://api.football-data.org/v4";
    private readonly systemUserId: UserId;

    constructor() {
        const apiKey = process.env.FOOTBALL_DATA_API_KEY;
        if (!apiKey) {
            throw new Error("FOOTBALL_DATA_API_KEY is not set");
        }
        this.apiKey = apiKey;
        this.systemUserId = SYSTEM_SCHEDULER_USER_ID;
    }

    /**
     * 특정 리그의 예정된 경기 조회
     */
    async fetchUpcomingMatches(
        competition: string,
        dateFrom?: Date,
        dateTo?: Date
    ): Promise<FootballDataMatch[]> {
        try {
            const from = dateFrom ?? new Date();
            const to = dateTo ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후

            const fromStr = from.toISOString().split("T")[0];
            const toStr = to.toISOString().split("T")[0];

            const url = `${this.baseUrl}/competitions/${competition}/matches?dateFrom=${fromStr}&dateTo=${toStr}&status=SCHEDULED`;

            const response = await fetch(url, {
                headers: {
                    "X-Auth-Token": this.apiKey,
                },
            });

            if (!response.ok) {
                console.error(`[FootballScheduler] API error: ${response.status}`);
                return [];
            }

            const data: FootballDataMatchesResponse = await response.json();
            return data.matches;
        } catch (error) {
            console.error("[FootballScheduler] Fetch error:", error);
            return [];
        }
    }

    /**
     * 모든 지원 리그의 예정된 경기 조회
     */
    async fetchAllUpcomingMatches(days: number = 14): Promise<FootballDataMatch[]> {
        const allMatches: FootballDataMatch[] = [];
        const dateFrom = new Date();
        const dateTo = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        for (let idx = 0; idx < SUPPORTED_LEAGUES.length; idx++) {
            const league = SUPPORTED_LEAGUES[idx];
            try {
                if (idx > 0) {
                    // API 레이트 리밋 방지 (10 req/min 한도 내 1.2초 간격)
                    await new Promise(resolve => setTimeout(resolve, 1200));
                }

                const matches = await this.fetchUpcomingMatches(league, dateFrom, dateTo);
                allMatches.push(...matches);
            } catch (error) {
                console.error(`[FootballScheduler] Error fetching ${league}:`, error);
            }
        }

        // 경기 시간순 정렬
        return allMatches.sort(
            (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
        );
    }

    /**
     * 경기를 게임 템플릿으로 변환
     */
    convertMatchToTemplate(match: FootballDataMatch): ScheduledGameTemplate {
        const now = new Date();
        const matchDate = new Date(match.utcDate);
        const leagueName = LEAGUE_NAMES[match.competition.code] ?? match.competition.name;

        // 즉시 참여 오픈, 경기 시작 10분 전 마감
        const scheduledTime = now;
        const closeTime = new Date(matchDate.getTime() - 10 * 60 * 1000);
        const duration = Math.max(
            2,
            Math.round(((closeTime.getTime() - scheduledTime.getTime()) / (60 * 60 * 1000)) * 10) / 10
        );

        // 경기 종료 후 약 1시간 뒤 정산 (경기 진행 2시간 + 여유 1시간)
        const settlementDelay = 3;

        const kstKickoff = new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            month: "long",
            day: "numeric",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(matchDate);

        const homeName = match.homeTeam.shortName || match.homeTeam.name;
        const awayName = match.awayTeam.shortName || match.awayTeam.name;

        return {
            id: `football-${match.id}`,
            title: `[${leagueName}] ${homeName} vs ${awayName}, 90분 승무패 결과는?`,
            description: [
                `🎯 매치 정보: ${leagueName} 매치데이 ${match.matchday} (${homeName} 홈 vs ${awayName} 원정)`,
                `🗓️ 킥오프 일정: ${kstKickoff} (KST 기준) · 경기 시작 10분 전 참여 마감`,
                `⚖️ 판정 기준: 연장·승부차기 제외 정규시간(90분+추가시간) 공식 스코어 기준 Football-Data API 자동 정산`,
            ].join("\n"),
            predictionType: PredictionType.WIN_DRAW_LOSE,
            options: [
                {
                    id: "HOME_TEAM",
                    label: `${homeName} 승`,
                    description: `${match.homeTeam.name} 정규시간 승리`,
                },
                {
                    id: "DRAW",
                    label: "무승부",
                    description: "정규시간 동점 무승부",
                },
                {
                    id: "AWAY_TEAM",
                    label: `${awayName} 승`,
                    description: `${match.awayTeam.name} 정규시간 승리`,
                },
            ],
            scheduledTime,
            duration,
            settlementDelay,
            minimumStake: 1000 as PmpAmount,
            maximumStake: this.getMaxStakeByLeague(match.competition.code),
            maxParticipants: this.getMaxParticipantsByLeague(match.competition.code),
            creatorId: this.systemUserId,
            category: "sports",
            importance: this.getImportanceByLeague(match.competition.code),
            recurrence: "once",
            isActive: true,
            sourceType: "football_data",
            sourceConfig: {
                matchId: match.id,
                competition: match.competition.code,
                homeTeam: match.homeTeam.shortName,
                awayTeam: match.awayTeam.shortName,
                optionMapping: {
                    HOME_TEAM: "HOME_TEAM",
                    DRAW: "DRAW",
                    AWAY_TEAM: "AWAY_TEAM",
                },
            },
        };
    }

    /**
     * 리그별 최대 스테이크 설정
     */
    private getMaxStakeByLeague(leagueCode: string): PmpAmount {
        const stakes: Record<string, number> = {
            PL: 100000,  // 프리미어리그 - 높은 관심도
            CL: 150000,  // 챔피언스리그 - 최고 관심도
            BL1: 80000,
            SA: 80000,
            PD: 100000,  // 라리가 - 높은 관심도
            FL1: 60000,
        };
        return (stakes[leagueCode] ?? 50000) as PmpAmount;
    }

    /**
     * 리그별 최대 참여자 설정
     */
    private getMaxParticipantsByLeague(leagueCode: string): number {
        const participants: Record<string, number> = {
            PL: 2000,
            CL: 3000,
            BL1: 1500,
            SA: 1500,
            PD: 2000,
            FL1: 1000,
        };
        return participants[leagueCode] ?? 1000;
    }

    /**
     * 리그별 중요도 설정
     */
    private getImportanceByLeague(
        leagueCode: string
    ): "low" | "medium" | "high" | "critical" {
        const importance: Record<string, "low" | "medium" | "high" | "critical"> = {
            PL: "high",
            CL: "critical",
            BL1: "medium",
            SA: "medium",
            PD: "high",
            FL1: "medium",
        };
        return importance[leagueCode] ?? "medium";
    }

    /**
     * 향후 2주 예정 경기 중 빅매치 최대 6경기에 대해 게임 템플릿 생성
     */
    async generateWeeklyGameTemplates(): Promise<ScheduledGameTemplate[]> {
        const matches = await this.fetchAllUpcomingMatches(14);
        const nowMs = Date.now();
        const futureMatches = matches.filter(
            (m) => new Date(m.utcDate).getTime() > nowMs + 90 * 60 * 1000
        );
        return futureMatches
            .slice(0, 6)
            .map(match => this.convertMatchToTemplate(match));
    }

    /**
     * 오늘 예정된 경기에 대해 게임 템플릿 생성
     */
    async generateDailyGameTemplates(): Promise<ScheduledGameTemplate[]> {
        const matches = await this.fetchAllUpcomingMatches(1);
        return matches.map(match => this.convertMatchToTemplate(match));
    }
}

// 사용 예시:
// const scheduler = new FootballMatchSchedulerService();
// const templates = await scheduler.generateWeeklyGameTemplates();
// for (const template of templates) {
//   gameSchedulingService.addTemplate(template);
// }
