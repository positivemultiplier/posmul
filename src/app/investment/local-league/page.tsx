/**
 * Local League Page
 *
 * 지역 소상공인 투자 페이지
 * Categories: 의류, 식품, 건강, 생활용품
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import Link from "next/link";

export default function LocalLeaguePage() {
  const categories = [
    {
      slug: "clothing",
      title: "👗 의류",
      description: "지역 의류 매장 투자",
      count: "42개 매장",
      avgReturn: "18.5%",
      color: "from-pink-500 to-rose-500",
    },
    {
      slug: "food",
      title: "🍽️ 식품",
      description: "음식점 및 식품 매장",
      count: "89개 매장",
      avgReturn: "22.1%",
      color: "from-orange-500 to-red-500",
    },
    {
      slug: "health",
      title: "💊 건강",
      description: "약국, 헬스케어 매장",
      count: "34개 매장",
      avgReturn: "15.3%",
      color: "from-green-500 to-emerald-500",
    },
    {
      slug: "lifestyle",
      title: "🏠 생활용품",
      description: "생활용품, 가전 매장",
      count: "67개 매장",
      avgReturn: "16.8%",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🏪 Local League
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          지역 소상공인과 함께 성장하는 투자 플랫폼
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-blue-800 text-sm">
            💡 <strong>PMC 수익 창출:</strong> 지역 매장 투자를 통해
            PMC(위험자산)를 획득하고 지역 경제 활성화에 기여하세요
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/investment/local-league/${category.slug}`}
            className="group block"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border group-hover:border-blue-300">
              <div
                className={`h-24 bg-gradient-to-r ${category.color} p-4 text-white`}
              >
                <h3 className="text-xl font-bold">{category.title}</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-600 mb-3">{category.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">매장 수:</span>
                    <span className="font-medium">{category.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">평균 수익률:</span>
                    <span className="font-medium text-green-600">
                      {category.avgReturn}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🔄 Local League 투자 프로세스
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🏪</span>
            </div>
            <h3 className="font-semibold mb-2">매장 선택</h3>
            <p className="text-sm text-gray-600">
              지역 내 성장 가능성이 높은 소상공인 매장을 선택합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">💰</span>
            </div>
            <h3 className="font-semibold mb-2">PMC 투자</h3>
            <p className="text-sm text-gray-600">
              PMC(위험자산)를 투자하여 매장 운영을 지원합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">📈</span>
            </div>
            <h3 className="font-semibold mb-2">수익 분배</h3>
            <p className="text-sm text-gray-600">
              매장 성과에 따라 PMC 수익을 분배받습니다
            </p>
          </div>
        </div>
      </div>

      {/* TODO: 나중에 실제 매장 데이터로 교체 */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          🚧 <strong>개발 중:</strong> 실제 매장 데이터 연동 및 투자 인터페이스
          구현 예정
        </p>
      </div>
    </div>
  );
}
