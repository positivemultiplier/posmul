"use client";

<<<<<<< HEAD:apps/posmul-web/src/app/not-found.tsx
import { Button } from "@posmul/shared-ui";
=======
import Button from "@/shared/components/Button";
>>>>>>> main:src/app/not-found.tsx
import {
  ArrowLeft,
  Gamepad2,
  Heart,
  Home,
  MessageSquare,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

/**
 * 글로벌 404 Not Found 페이지
 *
 * PosMul의 경제 시스템과 연계된 재미있는 404 페이지로
 * 사용자를 다른 페이지로 유도합니다.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 애니메이션 영역 */}
        <div className="mb-12">
          <div className="relative">
            {/* 404 텍스트 */}
            <div className="text-9xl font-bold text-gray-200 select-none">
              404
            </div>

            {/* PMP/PMC 코인 애니메이션 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  PMP
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  PMC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 메시지 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            이 페이지는 Money Wave에 휩쓸려 갔나봐요! 🌊
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            찾으시는 페이지가 존재하지 않습니다. 대신 PosMul의 다양한 서비스를
            탐험해보세요!
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
            <p className="text-yellow-800 text-sm">
              💡 <strong>팁:</strong> URL을 다시 확인하거나 아래 링크를 통해
              원하는 페이지를 찾아보세요.
            </p>
          </div>
        </div>

        {/* 빠른 네비게이션 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* 예측 게임 */}
          <Link href="/prediction">
            <div className="bg-white p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Gamepad2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">예측 게임</h3>
              <p className="text-sm text-gray-600 mb-3">
                미래를 예측하고 PMP를 획득하세요
              </p>
              <div className="text-xs text-blue-600 font-medium">
                PMP 획득 가능
              </div>
            </div>
          </Link>

          {/* 투자 */}
          <Link href="/investment">
            <div className="bg-white p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">투자</h3>
              <p className="text-sm text-gray-600 mb-3">
                지역 경제에 투자하고 수익을 얻으세요
              </p>
              <div className="text-xs text-green-600 font-medium">
                PMP & PMC 획득
              </div>
            </div>
          </Link>

          {/* 기부 */}
          <Link href="/donation">
            <div className="bg-white p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">기부</h3>
              <p className="text-sm text-gray-600 mb-3">
                PMC로 의미있는 기부를 실천하세요
              </p>
              <div className="text-xs text-pink-600 font-medium">PMC 사용</div>
            </div>
          </Link>

          {/* 포럼 */}
          <Link href="/forum">
            <div className="bg-white p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">포럼</h3>
              <p className="text-sm text-gray-600 mb-3">
                토론과 브레인스토밍으로 소통하세요
              </p>
              <div className="text-xs text-purple-600 font-medium">
                PMP 획득 가능
              </div>
            </div>
          </Link>
        </div>

        {/* 검색 및 액션 버튼들 */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="primary" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                대시보드로 돌아가기
              </Button>
            </Link>

            <button
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로
            </button>
          </div>

          {/* 검색 제안 */}
          <div className="bg-white rounded-xl p-6 border shadow-lg">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center justify-center">
              <Search className="w-4 h-4 mr-2" />
              찾고 계신 것이 있나요?
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/prediction">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors cursor-pointer">
                  예측 게임 참여
                </span>
              </Link>
              <Link href="/investment">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors cursor-pointer">
                  투자 기회
                </span>
              </Link>
              <Link href="/donation">
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm hover:bg-pink-200 transition-colors cursor-pointer">
                  기부하기
                </span>
              </Link>
              <Link href="/forum">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors cursor-pointer">
                  커뮤니티
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* PosMul 소개 */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            PosMul: AI 시대의 직접 민주주의 플랫폼
          </h3>
          <p className="text-gray-700 mb-6">
            예측 게임, 투자, 기부, 포럼을 통해 지역 경제와 사회에 참여하세요.
            PMP(무위험 자산)와 PMC(위험 자산)를 활용한 혁신적인 경제 시스템을
            경험해보세요.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">PMP</div>
              <div className="text-xs text-gray-600">무위험 자산</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="text-lg font-bold text-pink-600">PMC</div>
              <div className="text-xs text-gray-600">위험 자산</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">예측</div>
              <div className="text-xs text-gray-600">미래 예측</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-600">투자</div>
              <div className="text-xs text-gray-600">지역 경제</div>
            </div>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>오류가 지속되면 기술 지원팀에 문의해주세요.</p>
          <p className="mt-2">
            이 페이지가 도움이 되셨나요?
            <Link
              href="/forum"
              className="text-blue-600 hover:text-blue-700 ml-1"
            >
              포럼에서 피드백 남기기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
