/**
 * 템플릿 관리 페이지 (관리자)
 */

"use client";

import { useState } from "react";
import Link from "next/link";

// 임시 데이터 (실제로는 GameSchedulingService에서 가져옴)
const mockTemplates = [
    { id: "kospi-daily", title: "오늘 코스피 등락", category: "economy", recurrence: "daily", enabled: true, importance: "medium" },
    { id: "nasdaq-daily", title: "나스닥(QQQ) 등락", category: "economy", recurrence: "daily", enabled: true, importance: "medium" },
    { id: "nvda-daily", title: "엔비디아(NVDA) 등락", category: "technology", recurrence: "daily", enabled: true, importance: "high" },
    { id: "bitcoin-hourly", title: "비트코인 시간별 등락", category: "economy", recurrence: "daily", enabled: true, importance: "low" },
    { id: "cpi-monthly", title: "소비자물가 상승률", category: "economy", recurrence: "monthly", enabled: true, importance: "high" },
    { id: "unemployment-monthly", title: "실업률 예측", category: "economy", recurrence: "monthly", enabled: true, importance: "high" },
    { id: "samsung-quarterly", title: "삼성전자 분기 영업이익", category: "economy", recurrence: "monthly", enabled: true, importance: "critical" },
    { id: "hyundai-quarterly", title: "현대자동차 분기 영업이익", category: "economy", recurrence: "monthly", enabled: true, importance: "high" },
    { id: "skhynix-quarterly", title: "SK하이닉스 분기 순이익", category: "economy", recurrence: "monthly", enabled: true, importance: "high" },
    { id: "aapl-revenue", title: "애플 분기 매출", category: "technology", recurrence: "monthly", enabled: true, importance: "critical" },
    { id: "tsla-income", title: "테슬라 분기 순이익", category: "technology", recurrence: "monthly", enabled: true, importance: "high" },
    { id: "daily-soccer", title: "오늘의 축구 경기", category: "sports", recurrence: "daily", enabled: true, importance: "medium" },
    { id: "approval-rating", title: "대통령 지지율 예측", category: "politics", recurrence: "weekly", enabled: true, importance: "high" },
];

export default function TemplatesPage() {
    const [templates, setTemplates] = useState(mockTemplates);

    const toggleTemplate = (id: string) => {
        setTemplates((prev) =>
            prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
        );
    };

    const recurrenceLabels: Record<string, string> = {
        daily: "일간",
        weekly: "주간",
        monthly: "월간",
        once: "일회성",
    };

    const importanceColors: Record<string, string> = {
        low: "bg-gray-100 text-gray-800",
        medium: "bg-blue-100 text-blue-800",
        high: "bg-orange-100 text-orange-800",
        critical: "bg-red-100 text-red-800",
    };

    const categoryIcons: Record<string, string> = {
        economy: "📈",
        technology: "💻",
        sports: "⚽",
        politics: "🗳️",
        entertainment: "🎬",
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">📝 템플릿 관리</h1>
                        <p className="text-sm text-gray-500">정기 게임 생성 템플릿 관리</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        + 새 템플릿 추가
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* 필터 */}
                <div className="mb-6 flex gap-4">
                    <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                        <option value="">모든 카테고리</option>
                        <option value="economy">경제</option>
                        <option value="technology">기술</option>
                        <option value="sports">스포츠</option>
                        <option value="politics">정치</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                        <option value="">모든 주기</option>
                        <option value="daily">일간</option>
                        <option value="weekly">주간</option>
                        <option value="monthly">월간</option>
                    </select>
                </div>

                {/* 템플릿 목록 */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">상태</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">템플릿명</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">카테고리</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">주기</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">중요도</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {templates.map((template) => (
                                <tr key={template.id} className={`hover:bg-gray-50 ${!template.enabled ? "opacity-50" : ""}`}>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleTemplate(template.id)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${template.enabled ? "bg-blue-600" : "bg-gray-200"
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${template.enabled ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900">{template.title}</td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-2">
                                            {categoryIcons[template.category]}
                                            {template.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                            {recurrenceLabels[template.recurrence]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${importanceColors[template.importance]}`}>
                                            {template.importance}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button className="text-blue-600 hover:underline mr-3">수정</button>
                                        <button className="text-red-600 hover:underline">삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 통계 */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
                        <p className="text-sm text-gray-500">총 템플릿</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{templates.filter(t => t.enabled).length}</p>
                        <p className="text-sm text-gray-500">활성</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{templates.filter(t => t.recurrence === "daily").length}</p>
                        <p className="text-sm text-gray-500">일간</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">{templates.filter(t => t.recurrence === "monthly").length}</p>
                        <p className="text-sm text-gray-500">월간/분기</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
