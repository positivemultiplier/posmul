/**
 * 스케줄러 관리 페이지 (관리자)
 * 
 * 스케줄러 상태 확인, 수동 동기화, 설정 관리
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SchedulerStatus {
    isRunning: boolean;
    footballEnabled: boolean;
    earningsEnabled: boolean;
    templatesCount: number;
    lastSync: string;
    nextSync: string;
}

export default function SchedulerPage() {
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);

    // 상태 조회
    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/admin/scheduler/sync");
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error("Failed to fetch status:", error);
        }
    };

    // 수동 동기화
    const triggerSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const res = await fetch("/api/admin/scheduler/sync", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setSyncResult(`✅ 동기화 완료! Football: ${data.stats?.footballGames ?? 0}개, Earnings: ${data.stats?.earningsGames ?? 0}개`);
                fetchStatus();
            } else {
                setSyncResult(`❌ 동기화 실패: ${data.error}`);
            }
        } catch (error) {
            setSyncResult("❌ 동기화 중 오류 발생");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // 30초마다 갱신
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold text-gray-900">⏰ 스케줄러 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        정기 게임 자동 생성 스케줄러를 관리합니다.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* 상태 요약 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📊 스케줄러 상태</h2>

                    {status ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatusCard
                                title="상태"
                                value={status.isRunning ? "실행 중" : "중지됨"}
                                color={status.isRunning ? "green" : "red"}
                            />
                            <StatusCard
                                title="Football Data"
                                value={status.footballEnabled ? "활성" : "비활성"}
                                color={status.footballEnabled ? "green" : "gray"}
                            />
                            <StatusCard
                                title="Earnings Calendar"
                                value={status.earningsEnabled ? "활성" : "비활성"}
                                color={status.earningsEnabled ? "green" : "gray"}
                            />
                            <StatusCard
                                title="템플릿"
                                value={`${status.templatesCount}개`}
                                color="blue"
                            />
                        </div>
                    ) : (
                        <div className="text-gray-500">상태 로딩 중...</div>
                    )}

                    {status && (
                        <div className="mt-4 text-sm text-gray-500">
                            <p>마지막 동기화: {new Date(status.lastSync).toLocaleString("ko-KR")}</p>
                            <p>다음 예정: {new Date(status.nextSync).toLocaleString("ko-KR")}</p>
                        </div>
                    )}
                </section>

                {/* 수동 동기화 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">🔄 수동 동기화</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        외부 API에서 최신 데이터를 가져와 게임 템플릿을 업데이트합니다.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={triggerSync}
                            disabled={isSyncing}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSyncing ? "동기화 중..." : "지금 동기화 실행"}
                        </button>

                        {syncResult && (
                            <span className={`text-sm ${syncResult.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                                {syncResult}
                            </span>
                        )}
                    </div>
                </section>

                {/* 데이터 소스 설정 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📡 데이터 소스</h2>

                    <div className="space-y-4">
                        <DataSourceCard
                            name="Football Data API"
                            icon="⚽"
                            description="프리미어리그, 챔피언스리그 등 축구 경기 일정"
                            enabled={true}
                            leagues={["PL", "CL", "BL1", "SA", "PD", "FL1"]}
                        />
                        <DataSourceCard
                            name="FMP Earnings Calendar"
                            icon="📈"
                            description="빅테크/금융 기업 분기 실적 발표 일정"
                            enabled={true}
                            companies={["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN"]}
                        />
                        <DataSourceCard
                            name="Alpha Vantage"
                            icon="📊"
                            description="일일 주가 데이터 (나스닥, 엔비디아 등)"
                            enabled={true}
                        />
                        <DataSourceCard
                            name="DART 공시"
                            icon="🏢"
                            description="한국 기업 분기 실적 (삼성전자, 현대차, SK하이닉스)"
                            enabled={true}
                        />
                        <DataSourceCard
                            name="KOSIS 통계"
                            icon="📉"
                            description="경제 지표 (소비자물가, 실업률, GDP)"
                            enabled={true}
                        />
                    </div>
                </section>

                {/* Cron 설정 가이드 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Cron 설정 가이드</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        자동 동기화를 위해 아래 설정을 추가하세요.
                    </p>

                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-green-400">
                            {`// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/scheduler/sync",
      "schedule": "0 * * * *"  // 매시 정각
    }
  ]
}

// 환경 변수
CRON_SECRET=your-secret-key`}
                        </pre>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        <p>💡 Vercel Pro 플랜 이상에서 Cron Jobs 사용 가능</p>
                        <p>💡 무료 대안: GitHub Actions, Supabase pg_cron</p>
                    </div>
                </section>
            </main>
        </div>
    );
}

function StatusCard({
    title,
    value,
    color,
}: {
    title: string;
    value: string;
    color: "green" | "red" | "gray" | "blue";
}) {
    const colors = {
        green: "bg-green-100 text-green-800",
        red: "bg-red-100 text-red-800",
        gray: "bg-gray-100 text-gray-800",
        blue: "bg-blue-100 text-blue-800",
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`mt-1 px-2 py-1 rounded inline-block text-sm font-medium ${colors[color]}`}>
                {value}
            </p>
        </div>
    );
}

function DataSourceCard({
    name,
    icon,
    description,
    enabled,
    leagues,
    companies,
}: {
    name: string;
    icon: string;
    description: string;
    enabled: boolean;
    leagues?: string[];
    companies?: string[];
}) {
    return (
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                    {leagues && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {leagues.map((l) => (
                                <span key={l} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                    {l}
                                </span>
                            ))}
                        </div>
                    )}
                    {companies && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {companies.map((c) => (
                                <span key={c} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                    {c}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${enabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                {enabled ? "활성" : "비활성"}
            </span>
        </div>
    );
}
