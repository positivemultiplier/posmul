/**
 * 컴포넌트 프리뷰 클라이언트
 *
 * Phase 1-4 UI 컴포넌트들을 인터랙티브하게 테스트합니다.
 */
"use client";

import React, { useState } from "react";

// Phase 1: 차트
import { SparkLine } from "../../shared/ui/charts/SparkLine";
import { OddsChart } from "../../shared/ui/charts/OddsChart";

// Phase 3: 실시간
import { RealtimeOddsIndicator } from "../../shared/ui/components/RealtimeOddsIndicator";
import { NotificationContainer, type Notification } from "../../shared/ui/components/NotificationToast";

// Phase 4: 게이미피케이션
import { AchievementBadge, type AchievementBadgeData } from "../../shared/ui/components/AchievementBadge";
import { LeaderboardCard, type LeaderEntry } from "../../shared/ui/components/LeaderboardCard";
import { UserLevelProgress, type LevelData } from "../../shared/ui/components/UserLevelProgress";

// MoneyWave 컴포넌트 (prediction 도메인)
import { CompactMoneyWaveCard } from "../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";

/** 섹션 Props */
interface SectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

/** 섹션 컴포넌트 */
const Section: React.FC<SectionProps> = ({ title, description, children }) => (
    <section className="mb-12 p-6 rounded-2xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-6">{description}</p>
        {children}
    </section>
);

/** 샘플 배지 데이터 */
const SAMPLE_BADGES: AchievementBadgeData[] = [
    {
        id: "first-win",
        name: "첫 승리",
        description: "첫 번째 예측 성공",
        icon: "trophy",
        rarity: "common",
        category: "prediction",
        unlocked: true,
        unlockedAt: new Date("2026-01-10"),
    },
    {
        id: "streak-7",
        name: "7일 연속",
        description: "7일 연속 예측 참여",
        icon: "zap",
        rarity: "rare",
        category: "streak",
        unlocked: true,
        unlockedAt: new Date("2026-01-12"),
    },
    {
        id: "donor-100k",
        name: "대기부자",
        description: "10만 PMC 기부 달성",
        icon: "heart",
        rarity: "epic",
        category: "donation",
        unlocked: false,
        progress: 65,
        requirement: "10만 PMC 기부",
    },
    {
        id: "master-predictor",
        name: "마스터 예측가",
        description: "예측 성공률 90% 달성",
        icon: "award",
        rarity: "legendary",
        category: "prediction",
        unlocked: false,
        progress: 88,
        requirement: "성공률 90%",
    },
];

/** 샘플 리더보드 데이터 */
const SAMPLE_LEADERS: LeaderEntry[] = [
    { rank: 1, userId: "user1", username: "예측의신", score: 95, previousRank: 1 },
    { rank: 2, userId: "user2", username: "분석가123", score: 89, previousRank: 4 },
    { rank: 3, userId: "user3", username: "정치통", score: 85, previousRank: 2 },
    { rank: 4, userId: "current", username: "나", score: 78, previousRank: 5 },
    { rank: 5, userId: "user5", username: "스포츠매니아", score: 72, previousRank: 3 },
];

/** 샘플 레벨 데이터 */
const SAMPLE_LEVEL: LevelData = {
    currentLevel: 15,
    currentXP: 2500,
    nextLevelXP: 3000,
    totalXP: 15000,
    levelName: "우수 예측가",
};

/** 샘플 오즈 차트 데이터 (OddsOption 형식) */
const SAMPLE_ODDS = [
    { id: "A", label: "맨시티 승", odds: 0.45, color: "#60A5FA" },
    { id: "B", label: "무승부", odds: 0.25, color: "#A78BFA" },
    { id: "C", label: "아스날 승", odds: 0.30, color: "#F87171" },
];

/** 샘플 스파크라인 데이터 (DataPoint 형식) */
const SAMPLE_SPARKLINE = [
    { value: 45 }, { value: 48 }, { value: 42 }, { value: 50 },
    { value: 55 }, { value: 52 }, { value: 58 }, { value: 60 },
    { value: 55 }, { value: 62 }, { value: 65 },
];

export default function ComponentPreviewClient() {
    const [odds, setOdds] = useState(0.65);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [recentXP, setRecentXP] = useState<number | undefined>(undefined);

    // 알림 추가
    const addNotification = (type: Notification["type"], title: string, message: string) => {
        const id = Date.now().toString();
        setNotifications((prev) => [...prev, { id, type, title, message, autoHide: true, duration: 3000 }]);
    };

    // 알림 닫기
    const closeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    // 오즈 변경 시뮬레이션
    const simulateOddsChange = () => {
        const newOdds = Math.random() * 0.3 + 0.5; // 0.5 ~ 0.8
        setOdds(newOdds);
    };

    // XP 획득 시뮬레이션
    const simulateXPGain = () => {
        setRecentXP(150);
        setTimeout(() => setRecentXP(undefined), 2500);
    };

    return (
        <div className="space-y-8">
            {/* 알림 컨테이너 */}
            <NotificationContainer
                notifications={notifications}
                onClose={closeNotification}
                position="top-right"
            />

            {/* Phase 1: 차트 컴포넌트 */}
            <Section title="Phase 1: 차트 컴포넌트" description="SparkLine, OddsChart">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                        <h3 className="text-white font-medium mb-4">SparkLine</h3>
                        <SparkLine
                            data={SAMPLE_SPARKLINE}
                            color="#60A5FA"
                            height={60}
                        />
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                        <h3 className="text-white font-medium mb-4">OddsChart (horizontal-bar)</h3>
                        <OddsChart options={SAMPLE_ODDS} variant="horizontal-bar" />
                    </div>
                </div>
            </Section>

            {/* Phase 3: 실시간 컴포넌트 */}
            <Section title="Phase 3: 실시간 컴포넌트" description="RealtimeOddsIndicator, NotificationToast">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400">오즈:</span>
                        <RealtimeOddsIndicator odds={odds} size="lg" />
                        <button
                            onClick={simulateOddsChange}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            오즈 변경 시뮬레이션
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => addNotification("success", "베팅 성공!", "맨시티 승에 1000 PMP 베팅 완료")}
                            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg"
                        >
                            성공 알림
                        </button>
                        <button
                            onClick={() => addNotification("error", "오류 발생", "잔액이 부족합니다")}
                            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg"
                        >
                            에러 알림
                        </button>
                        <button
                            onClick={() => addNotification("info", "안내", "새로운 예측 게임이 시작되었습니다")}
                            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg"
                        >
                            정보 알림
                        </button>
                    </div>
                </div>
            </Section>

            {/* Phase 4: 게이미피케이션 */}
            <Section title="Phase 4: 게이미피케이션" description="AchievementBadge, LeaderboardCard, UserLevelProgress">
                <div className="space-y-8">
                    {/* 배지 */}
                    <div>
                        <h3 className="text-white font-medium mb-4">성과 배지</h3>
                        <div className="flex flex-wrap gap-4">
                            {SAMPLE_BADGES.map((badge) => (
                                <AchievementBadge
                                    key={badge.id}
                                    badge={badge}
                                    size="md"
                                    onClick={(b) => console.log("Clicked:", b.name)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 레벨 진행 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-white font-medium mb-4">레벨 진행률</h3>
                            <UserLevelProgress level={SAMPLE_LEVEL} recentXPGain={recentXP} />
                            <button
                                onClick={simulateXPGain}
                                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                            >
                                XP 획득 시뮬레이션 (+150)
                            </button>
                        </div>

                        {/* 리더보드 */}
                        <div>
                            <h3 className="text-white font-medium mb-4">리더보드</h3>
                            <LeaderboardCard
                                type="prediction"
                                title="예측 성공률 TOP 5"
                                leaders={SAMPLE_LEADERS}
                                currentUserId="current"
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* MoneyWave 컴포넌트 비교 */}
            <Section title="MoneyWave 컴포넌트" description="CompactMoneyWaveCard (prediction 도메인 전용 - 개선 버전)">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-white font-medium mb-4">CompactMoneyWaveCard (개선됨)</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Wave 번호/타입, 게임 수, 참여자 수, 진행률이 명확하게 표시됩니다.
                        </p>
                        <CompactMoneyWaveCard category="all" />
                    </div>
                </div>
            </Section>
        </div>
    );
}

