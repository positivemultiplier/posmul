/**
 * Forum Main Page
 *
 * Overview page for forum domain showing two main categories:
 * - Brainstorming: 아이디어 발굴 및 브레인스토밍
 * - Debate: 토론 및 의견 교환
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import Link from "next/link";

export default function ForumPage() {
  const forumCategories = [
    {
      slug: "brainstorming",
      title: "💡 브레인스토밍",
      description: "창의적 아이디어 발굴",
      subtitle: "혁신, 창업, 기술, 사회문제 해결",
      color: "from-blue-500 to-indigo-600",
      stats: "342개 세션 • 평균 참여자 12명",
      features: ["PMP 수익 창출", "아이디어 공유", "협업 기회"],
      reward: "아이디어 제안 시 PMP 획득",
    },
    {
      slug: "debate",
      title: "🗣️ 토론",
      description: "건설적 토론과 의견 교환",
      subtitle: "정치, 경제, 사회, 문화, 기술",
      color: "from-purple-500 to-pink-600",
      stats: "178개 토론 • 평균 참여자 24명",
      features: ["PMP 수익 창출", "논리적 사고", "다양한 관점"],
      reward: "고품질 토론 참여 시 PMP 획득",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">💬 Forum</h1>
        <p className="text-xl text-gray-600 mb-8">
          PosMul 커뮤니티에서 아이디어를 나누고 토론하며 PMP를 획득하세요
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">520</div>
            <div className="text-gray-600">총 토론/세션</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">15.8K</div>
            <div className="text-gray-600">활성 참여자</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">₱2.8M</div>
            <div className="text-gray-600">총 PMP 보상</div>
          </div>
        </div>
      </div>

      {/* Forum Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {forumCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/forum/${category.slug}`}
            className="group block"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border group-hover:border-gray-300">
              <div
                className={`h-40 bg-gradient-to-r ${category.color} p-6 text-white`}
              >
                <h3 className="text-3xl font-bold mb-2">{category.title}</h3>
                <p className="text-white/90 text-lg">{category.description}</p>
                <p className="text-white/80 text-sm mt-2">{category.reward}</p>
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
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* How Forum Works */}
      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🚀 포럼 참여 방법
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">1️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">주제 선택</h3>
            <p className="text-sm text-gray-600">
              관심 있는 브레인스토밍 또는 토론 주제를 선택합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">2️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">적극적 참여</h3>
            <p className="text-sm text-gray-600">
              창의적 아이디어나 논리적 의견을 제시합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">3️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">품질 평가</h3>
            <p className="text-sm text-gray-600">
              커뮤니티에서 기여도를 평가받습니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">4️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">PMP 획득</h3>
            <p className="text-sm text-gray-600">
              고품질 기여에 대해 PMP(안전자산) 보상을 받습니다
            </p>
          </div>
        </div>
      </div>

      {/* Agency Theory in Forum */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          🎯 Agency Theory와 포럼
        </h2>
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-700 mb-6 text-center">
            PosMul 포럼은 Agency Theory를 통해{" "}
            <strong>정보 비대칭성을 해결</strong>하고
            <strong>집단 지성</strong>을 활용합니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-purple-200">
              <h3 className="font-bold text-purple-700 mb-3">
                🧠 집단 지성 활용
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 다양한 전문성과 관점 결합</li>
                <li>• 정보 공유를 통한 지식 확산</li>
                <li>• 창의적 아이디어 발굴</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg border border-purple-200">
              <h3 className="font-bold text-purple-700 mb-3">
                ⚖️ 인센티브 설계
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 고품질 기여에 대한 PMP 보상</li>
                <li>• 평판 시스템을 통한 신뢰 구축</li>
                <li>• 건설적 토론 문화 조성</li>
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
            href="/forum/common/my-posts"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-medium">내 게시글</div>
          </Link>
          <Link
            href="/forum/common/bookmarks"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🔖</div>
            <div className="text-sm font-medium">북마크</div>
          </Link>
          <Link
            href="/forum/common/rewards"
            className="text-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm font-medium">PMP 보상 내역</div>
          </Link>
          <Link
            href="/forum/common/settings"
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
