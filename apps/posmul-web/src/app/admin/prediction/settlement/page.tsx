/**
 * 정산 관리 페이지 (관리자)
 * 
 * 게임 정산 상태 확인 및 수동 정산 처리
 */

import Link from "next/link";

// 임시 데이터
const pendingSettlements = [
    { id: "1", title: "어제 코스피 등락", endedAt: "2026-01-12 18:00", participants: 156, totalStake: "890,000 PMP", source: "alpha-vantage" },
    { id: "2", title: "EPL 맨유 vs 첼시", endedAt: "2026-01-12 23:00", participants: 234, totalStake: "1,250,000 PMP", source: "football-data" },
];

const completedSettlements = [
    { id: "3", title: "비트코인 20시 등락", settledAt: "2026-01-12 21:30", result: "상승", winners: 89, distributed: "450,000 PMC" },
    { id: "4", title: "삼성전자 Q4 실적", settledAt: "2026-01-10 18:00", result: "10조 초과", winners: 342, distributed: "2,890,000 PMC" },
    { id: "5", title: "챔피언스리그 결승", settledAt: "2026-01-08 05:00", result: "레알 마드리드 승", winners: 567, distributed: "4,560,000 PMC" },
];

export default function SettlementPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold text-gray-900">💰 정산 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        게임 결과 확정 및 상금 분배
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* 정산 대기 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                        정산 대기 ({pendingSettlements.length})
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">게임명</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">종료 시간</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">참여자</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">총 베팅</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">데이터 소스</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pendingSettlements.map((game) => (
                                    <tr key={game.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 font-medium text-gray-900">{game.title}</td>
                                        <td className="px-4 py-4 text-gray-600">{game.endedAt}</td>
                                        <td className="px-4 py-4 text-gray-600">{game.participants}명</td>
                                        <td className="px-4 py-4 text-gray-600">{game.totalStake}</td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                {game.source}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 space-x-2">
                                            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                                자동 정산
                                            </button>
                                            <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                                                수동 정산
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 정산 완료 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        정산 완료
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">게임명</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">정산 시간</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">결과</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">당첨자</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">분배 금액</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {completedSettlements.map((game) => (
                                    <tr key={game.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 font-medium text-gray-900">{game.title}</td>
                                        <td className="px-4 py-4 text-gray-600">{game.settledAt}</td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                                {game.result}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{game.winners}명</td>
                                        <td className="px-4 py-4 text-gray-600">{game.distributed}</td>
                                        <td className="px-4 py-4">
                                            <button className="text-blue-600 hover:underline text-sm">상세보기</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 정산 통계 */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="총 정산 건수" value="156" suffix="건" color="blue" />
                    <StatCard title="총 분배 금액" value="12,450,000" suffix="PMC" color="green" />
                    <StatCard title="평균 당첨률" value="42.3" suffix="%" color="purple" />
                    <StatCard title="대기 중" value="2" suffix="건" color="yellow" />
                </section>
            </main>
        </div>
    );
}

function StatCard({
    title,
    value,
    suffix,
    color,
}: {
    title: string;
    value: string;
    suffix: string;
    color: "blue" | "green" | "purple" | "yellow";
}) {
    const colors = {
        blue: "text-blue-600",
        green: "text-green-600",
        purple: "text-purple-600",
        yellow: "text-yellow-600",
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-2">
                <span className={`text-3xl font-bold ${colors[color]}`}>{value}</span>
                <span className="text-gray-500 ml-1">{suffix}</span>
            </p>
        </div>
    );
}
