/**
 * Local League Page
 *
 * 지역 소상공인 투자 카테고리 페이지
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

export default function LocalLeaguePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">🏪 Local League</h1>
        <p className="mt-4 text-lg text-gray-600">
          지역 소상공인과 함께하는 투자 프로그램
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">소매업</h3>
          <p className="text-gray-600 text-sm mb-4">지역 소매업체 투자 기회</p>
          <div className="text-sm text-green-600">15개 프로젝트</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">음식점</h3>
          <p className="text-gray-600 text-sm mb-4">지역 음식점 투자 기회</p>
          <div className="text-sm text-green-600">12개 프로젝트</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">서비스업</h3>
          <p className="text-gray-600 text-sm mb-4">지역 서비스업 투자 기회</p>
          <div className="text-sm text-green-600">10개 프로젝트</div>
        </div>
      </div>
    </div>
  );
}
