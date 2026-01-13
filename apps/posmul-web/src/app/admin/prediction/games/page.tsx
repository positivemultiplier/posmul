/**
 * 예측 게임 목록 페이지 (관리자)
 */

import Link from "next/link";

// 임시 데이터
const mockGames = {
    active: [
        { id: "1", title: "[EPL] 맨유 vs 첼시", category: "sports", participants: 234, totalStake: 1250000, endTime: "2026-01-13 23:00" },
        { id: "2", title: "오늘 나스닥 등락", category: "economy", participants: 156, totalStake: 890000, endTime: "2026-01-14 05:00" },
        { id: "3", title: "비트코인 시간별 등락", category: "economy", participants: 89, totalStake: 450000, endTime: "2026-01-13 18:00" },
    ],
    pending: [
        { id: "4", title: "삼성전자 Q1 실적", category: "economy", scheduledAt: "2026-01-15 09:00" },
        { id: "5", title: "애플 분기 매출", category: "technology", scheduledAt: "2026-01-20 22:00" },
    ],
    completed: [
        { id: "6", title: "어제 코스피 등락", category: "economy", result: "상승", participants: 312, distributed: 1680000 },
        { id: "7", title: "EPL 아스널 vs 리버풀", category: "sports", result: "홈팀 승", participants: 456, distributed: 2340000 },
    ],
};

export default function GamesListPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">🎮 게임 목록</h1>
                    <Link
                        href="/admin/prediction/games/create"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + 새 게임 생성
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* 활성 게임 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        활성 게임 ({mockGames.active.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">게임명</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">카테고리</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">참여자</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">총 베팅</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">종료 시간</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {mockGames.active.map((game) => (
                                    <tr key={game.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 font-medium text-gray-900">{game.title}</td>
                                        <td className="px-4 py-4">
                                            <CategoryBadge category={game.category} />
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{game.participants}명</td>
                                        <td className="px-4 py-4 text-gray-600">{game.totalStake.toLocaleString()} PMP</td>
                                        <td className="px-4 py-4 text-gray-600">{game.endTime}</td>
                                        <td className="px-4 py-4">
                                            <Link href={`/admin/prediction/games/${game.id}`} className="text-blue-600 hover:underline mr-3">
                                                상세
                                            </Link>
                                            <button className="text-red-600 hover:underline">중지</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 대기 중 게임 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        대기 중 ({mockGames.pending.length})
                    </h2>
                    <div className="space-y-3">
                        {mockGames.pending.map((game) => (
                            <div key={game.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{game.title}</p>
                                    <p className="text-sm text-gray-500">예정: {game.scheduledAt}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CategoryBadge category={game.category} />
                                    <button className="text-blue-600 hover:underline">수정</button>
                                    <button className="text-red-600 hover:underline">삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 완료된 게임 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                        완료된 게임 ({mockGames.completed.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">게임명</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">결과</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">참여자</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">분배금액</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {mockGames.completed.map((game) => (
                                    <tr key={game.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 font-medium text-gray-900">{game.title}</td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                {game.result}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{game.participants}명</td>
                                        <td className="px-4 py-4 text-gray-600">{game.distributed.toLocaleString()} PMC</td>
                                        <td className="px-4 py-4">
                                            <Link href={`/admin/prediction/games/${game.id}`} className="text-blue-600 hover:underline">
                                                상세보기
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

function CategoryBadge({ category }: { category: string }) {
    const colors: Record<string, string> = {
        sports: "bg-green-100 text-green-800",
        economy: "bg-blue-100 text-blue-800",
        technology: "bg-purple-100 text-purple-800",
        entertainment: "bg-pink-100 text-pink-800",
        politics: "bg-orange-100 text-orange-800",
    };
    const labels: Record<string, string> = {
        sports: "스포츠",
        economy: "경제",
        technology: "기술",
        entertainment: "엔터",
        politics: "정치",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs ${colors[category] ?? "bg-gray-100 text-gray-800"}`}>
            {labels[category] ?? category}
        </span>
    );
}
