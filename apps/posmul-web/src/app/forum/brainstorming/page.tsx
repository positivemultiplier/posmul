/**
 * Brainstorming Page
 *
 * 브레인스토밍 카테고리 페이지
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

export default function BrainstormingPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">💡 브레인스토밍</h1>
        <p className="mt-4 text-lg text-gray-600">
          창의적 아이디어 제안과 협업 공간
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            정책 제안
          </h3>
          <p className="text-gray-600 text-sm mb-4">지역 정책 개선 아이디어</p>
          <div className="text-sm text-blue-600">78개 제안</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            기술 혁신
          </h3>
          <p className="text-gray-600 text-sm mb-4">새로운 기술 아이디어</p>
          <div className="text-sm text-green-600">45개 제안</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            사회 문제
          </h3>
          <p className="text-gray-600 text-sm mb-4">사회 문제 해결방안</p>
          <div className="text-sm text-purple-600">67개 제안</div>
        </div>
      </div>
    </div>
  );
}
