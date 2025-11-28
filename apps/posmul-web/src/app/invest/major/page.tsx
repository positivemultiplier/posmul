/**
 * Major League Page
 *
 * 대기업/브랜드 투자 카테고리 페이지
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

export default function MajorLeaguePage() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">🏢 Major League</h1>
                <p className="mt-4 text-lg text-gray-600">
                    유망 기업과 브랜드에 투자하는 프로그램
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">제품</h3>
                    <p className="text-gray-600 text-sm mb-4">신제품 출시 투자</p>
                    <div className="text-sm text-blue-600">8개 프로젝트</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">서비스</h3>
                    <p className="text-gray-600 text-sm mb-4">혁신 서비스 투자</p>
                    <div className="text-sm text-blue-600">5개 프로젝트</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">브랜드</h3>
                    <p className="text-gray-600 text-sm mb-4">브랜드 가치 투자</p>
                    <div className="text-sm text-blue-600">12개 프로젝트</div>
                </div>
            </div>
        </div>
    );
}
