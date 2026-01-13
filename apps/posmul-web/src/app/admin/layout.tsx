/**
 * 관리자 레이아웃
 * 
 * 관리자 전용 사이드바 및 헤더
 */

import Link from "next/link";
import type { ReactNode } from "react";

const adminNavItems = [
    { href: "/admin/prediction", label: "대시보드", icon: "📊" },
    { href: "/admin/prediction/games", label: "게임 목록", icon: "🎮" },
    { href: "/admin/prediction/games/create", label: "게임 생성", icon: "➕" },
    { href: "/admin/prediction/templates", label: "템플릿 관리", icon: "📝" },
    { href: "/admin/prediction/scheduler", label: "스케줄러", icon: "⏰" },
    { href: "/admin/prediction/settlement", label: "정산 관리", icon: "💰" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* 사이드바 */}
            <aside className="w-64 bg-gray-900 text-white">
                <div className="p-6">
                    <Link href="/admin" className="text-xl font-bold flex items-center gap-2">
                        <span>🛠️</span>
                        <span>관리자</span>
                    </Link>
                </div>
                <nav className="px-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">
                        예측 게임
                    </p>
                    <ul className="space-y-1">
                        {adminNavItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <hr className="my-6 border-gray-700" />
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">
                        시스템
                    </p>
                    <ul className="space-y-1">
                        <li>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
                            >
                                <span>👥</span>
                                <span>사용자 관리</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/admin/logs"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
                            >
                                <span>📋</span>
                                <span>로그</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
                            >
                                <span>🏠</span>
                                <span>사이트로 돌아가기</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* 메인 콘텐츠 */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
