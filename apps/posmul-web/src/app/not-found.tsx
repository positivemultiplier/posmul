"use client";

import { Button } from "@posmul/shared-ui";
import Link from "next/link";

/**
 * 글로벌 404 Not Found 페이지
 *
 * PosMul의 경제 시스템과 연계된 재미있는 404 페이지로
 * 사용자를 다른 페이지로 유도합니다.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 아이콘 */}
        <div className="relative">
          <div className="text-8xl font-bold text-gray-200 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl">🎮</div>
          </div>
        </div>

        {/* 메시지 */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br />
            다른 페이지를 둘러보시거나 홈으로 돌아가세요.
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">홈으로 가기</Button>
            </Link>
            <Link href="/prediction" className="flex-1">
              <Button variant="outline" className="w-full">
                예측 게임
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/forum" className="flex-1">
              <Button variant="ghost" className="w-full">
                포럼 둘러보기
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              이전 페이지
            </Button>
          </div>
        </div>

        {/* 추천 링크 */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">추천 페이지</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              href="/investment"
              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">투자</div>
              <div className="text-gray-500">투자 기회 탐색</div>
            </Link>
            <Link
              href="/donation"
              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-gray-900">기부</div>
              <div className="text-gray-500">선한 영향력 전파</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
