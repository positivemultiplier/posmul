"use client";

import Link from "next/link";
import { Construction, ArrowLeft, Rocket } from "lucide-react";

interface UnderConstructionProps {
    /** 페이지 이름 (예: "소비", "기부") */
    pageName: string;
    /** 설명 메시지 */
    description?: string;
}

/**
 * 공사중 페이지 컴포넌트
 * 아직 구현되지 않은 페이지에 표시합니다.
 */
export function UnderConstruction({ pageName, description }: UnderConstructionProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-gray-950 text-white flex items-center justify-center">
            <div className="max-w-md mx-auto px-6 text-center space-y-8">
                {/* 아이콘 */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full animate-pulse" />
                    <div className="relative flex items-center justify-center w-full h-full">
                        <Construction className="w-16 h-16 text-amber-400" />
                    </div>
                </div>

                {/* 제목 */}
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                        🚧 {pageName}
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">준비 중입니다</p>
                </div>

                {/* 설명 */}
                <p className="text-gray-500 leading-relaxed">
                    {description || `${pageName} 서비스는 현재 개발 중입니다. 곧 만나보실 수 있습니다!`}
                </p>

                {/* 이용 가능 서비스 안내 */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <Rocket className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-blue-300">이용 가능한 서비스</span>
                    </div>
                    <p className="text-sm text-gray-400">
                        현재 <span className="text-blue-300 font-semibold">예측(Prediction)</span> 서비스를 이용하실 수 있습니다.
                        뉴스 기반 예측 게임에 참여해보세요!
                    </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/prediction"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold"
                    >
                        <Rocket className="w-5 h-5" />
                        예측 게임 하러 가기
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
