/**
 * Consume Main Page
 *
 * 소비 활동을 통한 PMP/PMC 획득 메인 페이지
 * - TimeConsume (구 Major League): 시간 투자 → PMP 획득
 * - MoneyConsume (구 Local League): 지역 소비 → PMC 획득
 * - CloudConsume (구 Cloud Funding): 클라우드 펀딩 → PMC 획득
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
import Link from "next/link";

export default function ConsumePage() {
  const consumeCategories = [
    {
      slug: "time",
      title: "⏰ TimeConsume",
      subtitle: "시간 투자 → PMP 획득",
      description: "광고 시청, 설문 참여로 PMP를 획득하세요",
      color: "from-purple-500 to-indigo-600",
      badge: "PMP",
      badgeColor: "bg-purple-100 text-purple-700",
      stats: "89개 캠페인 • 평균 +150 PMP/일",
      features: [
        "광고 시청 (+10~15 PMP)",
        "설문 참여 (+100 PMP)",
        "브랜드 체험 (+50 PMP)",
      ],
      cta: "시간 투자하기",
    },
    {
      slug: "money",
      title: "💳 MoneyConsume",
      subtitle: "지역 소비 → PMC 획득",
      description: "지역 매장에서 소비하고 PMC를 획득하세요",
      color: "from-blue-500 to-cyan-600",
      badge: "PMC",
      badgeColor: "bg-blue-100 text-blue-700",
      stats: "234개 매장 • 결제액 1% PMC",
      features: [
        "지역 소상공인 지원",
        "결제액 1% PMC 적립",
        "지역 경제 활성화",
      ],
      cta: "지역 매장 찾기",
    },
    {
      slug: "cloud",
      title: "☁️ CloudConsume",
      subtitle: "클라우드 펀딩 → PMC 획득",
      description: "창작 프로젝트를 후원하고 PMC를 획득하세요",
      color: "from-emerald-500 to-teal-600",
      badge: "PMC",
      badgeColor: "bg-emerald-100 text-emerald-700",
      stats: "156개 프로젝트 • 펀딩액 2% PMC",
      features: [
        "창작자 직접 지원",
        "얼리버드 리워드",
        "펀딩액 2% PMC 적립",
      ],
      cta: "프로젝트 둘러보기",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🛒 Consume</h1>
        <p className="text-xl text-gray-600 mb-2">
          소비 활동으로 PMP와 PMC를 획득하세요
        </p>
        <p className="text-sm text-gray-500 mb-8">
          시간을 투자하면 PMP, 돈을 사용하면 PMC를 얻습니다
        </p>

        {/* Currency Guide */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex items-center gap-3 bg-purple-50 px-6 py-3 rounded-full">
            <span className="text-2xl">⏰</span>
            <span className="text-purple-700 font-medium">시간 투자 → PMP</span>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full">
            <span className="text-2xl">💰</span>
            <span className="text-blue-700 font-medium">돈 투자 → PMC</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">479</div>
            <div className="text-gray-600">총 소비 기회</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">12.5K</div>
            <div className="text-gray-600">참여 사용자</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">2.3M</div>
            <div className="text-gray-600">총 획득 포인트</div>
          </div>
        </div>
      </div>

      {/* Consume Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {consumeCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/consume/${category.slug}`}
            className="group block"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border group-hover:border-gray-300 h-full">
              <div
                className={`h-36 bg-gradient-to-br ${category.color} p-6 text-white relative`}
              >
                <span
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${category.badgeColor}`}
                >
                  {category.badge} 획득
                </span>
                <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                <p className="text-white/90 text-sm">{category.subtitle}</p>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4 text-sm">
                  {category.description}
                </p>
                <p className="text-xs text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                  {category.stats}
                </p>
                <ul className="space-y-2 mb-6">
                  {category.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex items-center">
                    {category.cta}
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* How It Works - Value Chain */}
      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          💡 포인트 획득 → Donation 흐름
        </h2>
        <div className="relative">
          {/* Flow Chart */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* TimeConsume */}
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="font-semibold text-purple-800 mb-1">TimeConsume</h3>
              <p className="text-xs text-purple-600">광고/설문 참여</p>
              <div className="mt-2 px-2 py-1 bg-purple-200 rounded text-xs font-bold text-purple-800">
                → PMP 획득
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex justify-center">
              <div className="text-2xl text-gray-400">→</div>
            </div>

            {/* Expect */}
            <div className="text-center p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-amber-800 mb-1">Expect</h3>
              <p className="text-xs text-amber-600">PMP로 예측 게임</p>
              <div className="mt-2 px-2 py-1 bg-amber-200 rounded text-xs font-bold text-amber-800">
                성공 시 → PMC 변환
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex justify-center">
              <div className="text-2xl text-gray-400">→</div>
            </div>

            {/* Donation */}
            <div className="text-center p-4 bg-rose-50 rounded-xl border-2 border-rose-300">
              <div className="text-3xl mb-2">❤️</div>
              <h3 className="font-semibold text-rose-800 mb-1">Donation</h3>
              <p className="text-xs text-rose-600">PMC로만 기부 가능</p>
              <div className="mt-2 px-2 py-1 bg-rose-200 rounded text-xs font-bold text-rose-800">
                사회적 가치 창출
              </div>
            </div>
          </div>

          {/* Money Path */}
          <div className="mt-6 pt-6 border-t border-dashed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center max-w-3xl mx-auto">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  MoneyConsume / CloudConsume
                </h3>
                <p className="text-xs text-blue-600">지역 소비 / 펀딩</p>
                <div className="mt-2 px-2 py-1 bg-blue-200 rounded text-xs font-bold text-blue-800">
                  → PMC 직접 획득
                </div>
              </div>

              <div className="hidden md:flex justify-center">
                <div className="text-2xl text-gray-400">→</div>
              </div>

              <div className="text-center p-4 bg-rose-50 rounded-xl border-2 border-rose-300">
                <div className="text-3xl mb-2">❤️</div>
                <h3 className="font-semibold text-rose-800 mb-1">Donation</h3>
                <p className="text-xs text-rose-600">바로 기부 가능</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ 빠른 링크</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">내 잔액 확인</div>
          </Link>
          <Link
            href="/prediction"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium">Expect 게임</div>
          </Link>
          <Link
            href="/donation"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">❤️</div>
            <div className="text-sm font-medium">기부하기</div>
          </Link>
          <Link
            href="/forum"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="text-sm font-medium">Forum 참여</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
