/**
 * Investment Main Page
 *
 * Overview page for investment domain showing three main categories:
 * - Local League: 지역 소상공인 투자
 * - Major League: 대기업 광고 참여
 * - Cloud Funding: 크라우드 펀딩
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import Link from "next/link";

export default function InvestmentPage() {
  const investmentCategories = [
    {
      slug: "local-league",
      title: "🏪 Local League",
      description: "지역 소상공인 투자",
      subtitle: "의류, 식품, 건강, 생활용품",
      color: "from-blue-500 to-blue-600",
      stats: "234개 매장 • 평균 수익률 15.2%",
      features: ["지역 경제 활성화", "소상공인 직접 지원", "PMC 수익 창출"],
    },
    {
      slug: "major-league",
      title: "🏢 Major League",
      description: "대기업 광고 참여",
      subtitle: "제품, 서비스, 브랜드",
      color: "from-purple-500 to-purple-600",
      stats: "89개 캠페인 • 평균 수익률 8.7%",
      features: ["광고 시청 보상", "브랜드 참여", "PMP 수익 창출"],
    },
    {
      slug: "cloud-funding",
      title: "☁️ Cloud Funding",
      description: "크라우드 펀딩",
      subtitle: "액세서리, 도서, 영화, 공연",
      color: "from-green-500 to-green-600",
      stats: "156개 프로젝트 • 평균 수익률 22.8%",
      features: ["창작자 지원", "얼리버드 혜택", "PMC 수익 창출"],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">💼 Invest</h1>
        <p className="text-xl text-gray-600 mb-8">
          PosMul 투자 플랫폼에서 다양한 투자 기회를 발견하세요
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">479</div>
            <div className="text-gray-600">총 투자 기회</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">15.2%</div>
            <div className="text-gray-600">평균 수익률</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">12.5K</div>
            <div className="text-gray-600">참여 투자자</div>
          </div>
        </div>
      </div>

      {/* Investment Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {investmentCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/investment/${category.slug}`}
            className="group block"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border group-hover:border-gray-300">
              <div
                className={`h-32 bg-gradient-to-r ${category.color} p-6 text-white`}
              >
                <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                <p className="text-white/90">{category.description}</p>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">{category.subtitle}</p>
                <p className="text-sm text-gray-500 mb-4">{category.stats}</p>
                <ul className="space-y-2">
                  {category.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* How Investment Works */}
      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          💡 투자 플랫폼 작동 원리
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">1️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">투자 기회 발견</h3>
            <p className="text-sm text-gray-600">
              Local/Major League, Cloud Funding에서 투자 대상 선택
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">2️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">PMP/PMC 투자</h3>
            <p className="text-sm text-gray-600">
              안전자산(PMP) 또는 위험자산(PMC)으로 투자 참여
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">3️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">가치 창출</h3>
            <p className="text-sm text-gray-600">
              투자 대상의 성과에 따른 수익 창출
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">4️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">수익 분배</h3>
            <p className="text-sm text-gray-600">
              Agency Theory 기반 공정한 수익 분배
            </p>
          </div>
        </div>
      </div>

      {/* Common Features Access */}
      <div className="bg-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ 공통 기능</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/investment/common/portfolio"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">투자 포트폴리오</div>
          </Link>
          <Link
            href="/investment/common/notifications"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🔔</div>
            <div className="text-sm font-medium">알림 설정</div>
          </Link>
          <Link
            href="/investment/common/history"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-medium">투자 내역</div>
          </Link>
          <Link
            href="/investment/common/support"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="text-sm font-medium">고객 지원</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
