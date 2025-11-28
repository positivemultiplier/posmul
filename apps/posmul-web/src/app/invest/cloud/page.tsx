/**
 * Cloud Funding Page
 *
 * 크라우드 펀딩 투자 카테고리 페이지
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

export default function CloudFundingPage() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">☁️ Cloud Funding</h1>
                <p className="mt-4 text-lg text-gray-600">
                    다양한 창작과 혁신을 지원하는 크라우드 펀딩
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">문화/예술</h3>
                    <p className="text-gray-600 text-sm mb-4">영화, 도서, 공연 펀딩</p>
                    <div className="text-sm text-purple-600">20개 프로젝트</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">테크/가전</h3>
                    <p className="text-gray-600 text-sm mb-4">새로운 기술 제품 펀딩</p>
                    <div className="text-sm text-purple-600">15개 프로젝트</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">소셜/공익</h3>
                    <p className="text-gray-600 text-sm mb-4">사회 문제 해결 펀딩</p>
                    <div className="text-sm text-purple-600">10개 프로젝트</div>
                </div>
            </div>
        </div>
    );
}
