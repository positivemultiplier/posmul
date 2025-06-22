/**
 * Direct Donation Page
 *
 * 직접 기부 카테고리 페이지
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

export default function DirectDonationPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">🤝 직접 기부</h1>
        <p className="mt-4 text-lg text-gray-600">
          개인이나 가족에게 직접 도움을 전하는 기부
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            긴급 지원
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            응급상황에 처한 개인/가족 지원
          </p>
          <div className="text-sm text-red-600">32개 요청</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            교육 지원
          </h3>
          <p className="text-gray-600 text-sm mb-4">학비, 교육비 지원</p>
          <div className="text-sm text-blue-600">28개 요청</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            의료비 지원
          </h3>
          <p className="text-gray-600 text-sm mb-4">치료비, 수술비 지원</p>
          <div className="text-sm text-green-600">19개 요청</div>
        </div>
      </div>
    </div>
  );
}
