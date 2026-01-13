/**
 * 예측 게임 관리자 대시보드
 * 
 * 게임 생성, 모니터링, 스케줄러 관리
 */

import Link from "next/link";

// 임시 데이터 (실제로는 API에서 불러옴)
const mockStats = {
    activeGames: 12,
    pendingGames: 5,
    completedGames: 48,
    totalParticipants: 2340,
};

const mockSchedulerStatus = {
    football: { enabled: true, lastSync: "2026-01-13 15:00" },
    earnings: { enabled: true, lastSync: "2026-01-13 14:30" },
    templates: { enabled: true, count: 13 },
};

const mockUpcomingGames = [
    { id: "1", title: "[프리미어리그] 맨유 vs 첼시", scheduledAt: "2026-01-13 22:00", category: "sports" },
    { id: "2", title: "오늘 나스닥 등락 예측", scheduledAt: "2026-01-13 20:00", category: "economy" },
    { id: "3", title: "삼성전자 Q1 실적 예측", scheduledAt: "2026-01-15 09:00", category: "economy" },
];

const mockRecentGames = [
    { id: "4", title: "어제 코스피 등락", status: "정산 완료", participants: 156, result: "상승" },
    { id: "5", title: "EPL 아스널 vs 리버풀", status: "정산 완료", participants: 234, result: "홈팀 승" },
];

export default function AdminPredictionDashboard() {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* 헤더 */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                🎯 예측 게임 관리자
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                게임 생성, 모니터링, 스케줄러 관리
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/admin/prediction/games/create"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                + 새 게임 생성
                            </Link>
                            <Link
                                href="/admin/prediction/templates"
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                            >
                                템플릿 관리
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="활성 게임"
                        value={mockStats.activeGames}
                        icon="🎮"
                        color="bg-green-500"
                    />
                    <StatCard
                        title="대기 중"
                        value={mockStats.pendingGames}
                        icon="⏳"
                        color="bg-yellow-500"
                    />
                    <StatCard
                        title="완료된 게임"
                        value={mockStats.completedGames}
                        icon="✅"
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="총 참여자"
                        value={mockStats.totalParticipants.toLocaleString()}
                        icon="👥"
                        color="bg-purple-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 스케줄러 상태 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            ⚙️ 스케줄러 상태
                        </h2>
                        <div className="space-y-4">
                            <SchedulerStatusItem
                                name="Football Data"
                                enabled={mockSchedulerStatus.football.enabled}
                                lastSync={mockSchedulerStatus.football.lastSync}
                            />
                            <SchedulerStatusItem
                                name="Earnings Calendar"
                                enabled={mockSchedulerStatus.earnings.enabled}
                                lastSync={mockSchedulerStatus.earnings.lastSync}
                            />
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📝</span>
                                    <div>
                                        <p className="font-medium">Templates</p>
                                        <p className="text-sm text-gray-500">
                                            {mockSchedulerStatus.templates.count}개 템플릿 등록됨
                                        </p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                    활성
                                </span>
                            </div>
                        </div>
                        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            🔄 수동 동기화 실행
                        </button>
                    </div>

                    {/* 예정된 게임 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            📅 예정된 게임
                        </h2>
                        <div className="space-y-3">
                            {mockUpcomingGames.map((game) => (
                                <div
                                    key={game.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{game.title}</p>
                                        <p className="text-sm text-gray-500">{game.scheduledAt}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${game.category === "sports"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}>
                                        {game.category === "sports" ? "스포츠" : "경제"}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/admin/prediction/games"
                            className="mt-4 block text-center text-blue-600 hover:underline"
                        >
                            모든 게임 보기 →
                        </Link>
                    </div>
                </div>

                {/* 최근 완료된 게임 */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        📊 최근 완료된 게임
                    </h2>
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">게임명</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">상태</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">참여자</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">결과</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {mockRecentGames.map((game) => (
                                <tr key={game.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-sm text-gray-900">{game.title}</td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            {game.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">{game.participants}명</td>
                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{game.result}</td>
                                    <td className="px-4 py-4">
                                        <button className="text-blue-600 hover:underline text-sm">상세보기</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

// 통계 카드 컴포넌트
function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// 스케줄러 상태 아이템 컴포넌트
function SchedulerStatusItem({
    name,
    enabled,
    lastSync,
}: {
    name: string;
    enabled: boolean;
    lastSync: string;
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{name.includes("Football") ? "⚽" : "📈"}</span>
                <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-gray-500">마지막 동기화: {lastSync}</p>
                </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-sm ${enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                {enabled ? "활성" : "비활성"}
            </span>
        </div>
    );
}
