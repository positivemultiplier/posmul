/**
 * Donation Main Page
 *
 * Overview page for donation domain showing three main categories:
 * - Direct: 개인 간 직접 기부
 * - Institute: 기관을 통한 기부
 * - Opinion Leader: 오피니언 리더 기부
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import Link from "next/link";

export default function DonationPage() {
  const donationCategories = [
    {
      slug: "direct",
      title: "🤝 직접 기부",
      description: "개인 간 직접 기부",
      subtitle: "의류, 식품, 주거, 의료, 교육",
      color: "from-blue-500 to-blue-600",
      stats: "1,234건 기부 • 평균 금액 25,000원",
      features: ["투명한 기부 내역", "직접적인 도움", "PMC 활용"],
    },
    {
      slug: "institute",
      title: "🏛️ 기관 기부",
      description: "신뢰할 수 있는 기관 기부",
      subtitle: "긴급구호, 아동복지, 국제구호",
      color: "from-green-500 to-green-600",
      stats: "89개 기관 • 평균 금액 50,000원",
      features: ["검증된 기관", "체계적 지원", "PMC 활용"],
    },
    {
      slug: "opinion-leader",
      title: "👑 오피니언 리더",
      description: "영향력 있는 리더와 함께하는 기부",
      subtitle: "환경, 복지, 과학, 인권",
      color: "from-purple-500 to-purple-600",
      stats: "156명 리더 • 평균 금액 75,000원",
      features: ["사회적 영향력", "전문성 기반", "PMC 활용"],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">❤️ Donation</h1>
        <p className="text-xl text-gray-600 mb-8">
          PosMul Money Wave를 통한 새로운 기부 경험
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-red-600">1,479</div>
            <div className="text-gray-600">총 기부 건수</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">₩52.8M</div>
            <div className="text-gray-600">총 기부 금액</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">8.9K</div>
            <div className="text-gray-600">참여 기부자</div>
          </div>
        </div>
      </div>

      {/* Donation Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {donationCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/donation/${category.slug}`}
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
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Money Wave Donation System */}
      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🌊 Money Wave 기부 시스템
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">1️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">PMC 기부 결정</h3>
            <p className="text-sm text-gray-600">
              보유한 PMC(위험자산)로 기부할 금액을 결정합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">2️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">기부처 선택</h3>
            <p className="text-sm text-gray-600">
              직접, 기관, 오피니언 리더 중 원하는 방식을 선택합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">3️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">Money Wave 활성화</h3>
            <p className="text-sm text-gray-600">
              기부를 통해 Money Wave가 활성화되어 PMC 재분배가 시작됩니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">4️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">사회적 가치 창출</h3>
            <p className="text-sm text-gray-600">
              기부를 통해 사회적 가치를 창출하고 경제 순환을 촉진합니다
            </p>
          </div>
        </div>
      </div>

      {/* Agency Theory in Donation */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-8 border border-red-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          🎯 Agency Theory와 기부
        </h2>
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-700 mb-6 text-center">
            PosMul의 기부 시스템은 Agency Theory를 통해{" "}
            <strong>정보 비대칭성을 해결</strong>하고
            <strong>투명한 기부 생태계</strong>를 구축합니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-700 mb-3">🔍 정보 투명성</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 기부금 사용 내역 실시간 공개</li>
                <li>• 수혜자 피드백 시스템</li>
                <li>• 블록체인 기반 투명성 보장</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-700 mb-3">⚖️ 인센티브 정렬</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Money Wave를 통한 경제적 순환</li>
                <li>• 기부자와 수혜자 모두에게 혜택</li>
                <li>• 사회적 가치와 경제적 가치의 조화</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Common Features Access */}
      <div className="bg-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ 공통 기능</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/donation/common/history"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">기부 내역</div>
          </Link>
          <Link
            href="/donation/common/certificates"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm font-medium">기부 증명서</div>
          </Link>
          <Link
            href="/donation/common/impact"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🌍</div>
            <div className="text-sm font-medium">임팩트 리포트</div>
          </Link>
          <Link
            href="/donation/common/settings"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm font-medium">설정</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
