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

"use client";

import { useState } from "react";

import Link from "next/link";

import { DonationLeaderboard } from "../../bounded-contexts/donation/presentation/components/DonationLeaderboard";

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

export default function DonationPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const donationCategories = [
    {
      slug: "direct",
      title: "🤝 직접 기부",
      description: "개인 간 직접 기부",
      subtitle: "의류, 식품, 주거, 의료, 교육",
      color: "from-blue-500 to-blue-600",
      hoverColor: "from-blue-600 to-blue-700",
      stats: "1,234건 기부 • 평균 금액 25,000원",
      features: ["투명한 기부 내역", "직접적인 도움", "PmcAmount 활용"],
      impact: "지난 달 578명이 도움을 받았습니다",
    },
    {
      slug: "institute",
      title: "🏛️ 기관 기부",
      description: "신뢰할 수 있는 기관 기부",
      subtitle: "긴급구호, 아동복지, 국제구호",
      color: "from-green-500 to-green-600",
      hoverColor: "from-green-600 to-green-700",
      stats: "89개 기관 • 평균 금액 50,000원",
      features: ["검증된 기관", "체계적 지원", "PmcAmount 활용"],
      impact: "전국 156개 지역에서 활동 중입니다",
    },
    {
      slug: "opinion-leader",
      title: "👑 오피니언 리더",
      description: "영향력 있는 리더와 함께하는 기부",
      subtitle: "환경, 복지, 과학, 인권",
      color: "from-purple-500 to-purple-600",
      hoverColor: "from-purple-600 to-purple-700",
      stats: "156명 리더 • 평균 금액 75,000원",
      features: ["사회적 영향력", "전문성 기반", "PmcAmount 활용"],
      impact: "12개 분야의 전문가가 참여하고 있습니다",
    },
  ];

  const recentDonations = [
    { donor: "김**", amount: 50000, category: "의료", time: "2분 전" },
    { donor: "이**", amount: 25000, category: "교육", time: "5분 전" },
    { donor: "박**", amount: 100000, category: "긴급구호", time: "8분 전" },
    { donor: "최**", amount: 30000, category: "환경", time: "12분 전" },
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section with Animation */}
      <div className="relative bg-gradient-to-r from-red-50 via-pink-50 to-rose-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/20 to-pink-100/20"></div>
        <div className="relative text-center py-16 px-4">
          <div className="animate-pulse mb-4">
            <span className="text-6xl">❤️</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Donation
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            PosMul Money Wave를 통한 새로운 기부 경험
            <br />
            <span className="text-lg text-gray-600">
              당신의 작은 나눔이 큰 변화를 만듭니다
            </span>
          </p>

          {/* 실시간 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-red-600 mb-2">1,479</div>
              <div className="text-gray-700 font-medium">총 기부 건수</div>
              <div className="text-sm text-green-600 mt-1">↗ +23 오늘</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₩52.8M
              </div>
              <div className="text-gray-700 font-medium">총 기부 금액</div>
              <div className="text-sm text-green-600 mt-1">
                ↗ +₩1.2M 이번 주
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-blue-600 mb-2">8.9K</div>
              <div className="text-gray-700 font-medium">참여 기부자</div>
              <div className="text-sm text-green-600 mt-1">↗ +156 이번 달</div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Categories with Enhanced Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          기부 방식을 선택하세요
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {donationCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/donation/${category.slug}`}
              className="group block"
              onMouseEnter={() => setSelectedCategory(category.slug)}
              onMouseLeave={() => setSelectedCategory(null)}
            >
              <div
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 transform hover:-translate-y-2 ${
                  selectedCategory === category.slug
                    ? "border-gray-300 scale-105"
                    : "border-transparent"
                }`}
              >
                <div
                  className={`h-40 bg-gradient-to-r ${
                    selectedCategory === category.slug
                      ? category.hoverColor
                      : category.color
                  } p-6 text-white relative overflow-hidden transition-all duration-500`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">
                      {category.title}
                    </h3>
                    <p className="text-white/90 text-lg">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4 text-lg">
                    {category.subtitle}
                  </p>
                  <p className="text-sm text-gray-500 mb-4 font-medium">
                    {category.stats}
                  </p>
                  <p className="text-sm text-green-600 mb-4 font-medium">
                    {category.impact}
                  </p>
                  <ul className="space-y-3">
                    {category.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <span className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3 flex-shrink-0"></span>
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    <span>자세히 보기</span>
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
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 실시간 기부 현황 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
            실시간 기부 현황
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDonations.map((donation, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900">
                    {donation.donor}
                  </span>
                  <span className="text-xs text-gray-500">{donation.time}</span>
                </div>
                <div className="text-lg font-bold text-green-600 mb-1">
                  ₩{donation.amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{donation.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 기부 리더보드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DonationLeaderboard />
      </div>

      {/* Money Wave Donation System with Enhanced Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center">
            <span className="text-4xl mr-3">🌊</span>
            Money Wave 기부 시스템
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1️⃣",
                title: "PmcAmount 기부 결정",
                description:
                  "보유한 PmcAmount(위험자산)로 기부할 금액을 결정합니다",
                color: "red",
              },
              {
                step: "2️⃣",
                title: "기부처 선택",
                description:
                  "직접, 기관, 오피니언 리더 중 원하는 방식을 선택합니다",
                color: "blue",
              },
              {
                step: "3️⃣",
                title: "Money Wave 활성화",
                description:
                  "기부를 통해 Money Wave가 활성화되어 PmcAmount 재분배가 시작됩니다",
                color: "green",
              },
              {
                step: "4️⃣",
                title: "사회적 가치 창출",
                description:
                  "기부를 통해 사회적 가치를 창출하고 경제 순환을 촉진합니다",
                color: "purple",
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`w-16 h-16 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-2xl">{item.step}</span>
                </div>
                <h3 className="font-bold mb-3 text-lg text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agency Theory in Donation with Enhanced Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
            <span className="text-4xl mr-3">🎯</span>
            Agency Theory와 기부
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-700 mb-8 text-center text-lg leading-relaxed">
              PosMul의 기부 시스템은 Agency Theory를 통해{" "}
              <strong className="text-red-600">정보 비대칭성을 해결</strong>하고{" "}
              <strong className="text-red-600">투명한 기부 생태계</strong>를
              구축합니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl border border-red-200 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-red-700 mb-4 text-xl flex items-center">
                  <span className="text-2xl mr-3">🔍</span>
                  정보 투명성
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>기부금 사용 내역 실시간 공개</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>수혜자 피드백 시스템</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>블록체인 기반 투명성 보장</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-xl border border-red-200 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-red-700 mb-4 text-xl flex items-center">
                  <span className="text-2xl mr-3">⚖️</span>
                  인센티브 정렬
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>Money Wave를 통한 경제적 순환</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>기부자와 수혜자 모두에게 혜택</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>사회적 가치와 경제적 가치의 조화</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Features Access with Enhanced Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border shadow-lg">
          <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 flex items-center justify-center">
            <span className="text-3xl mr-3">⚙️</span>
            공통 기능
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                href: "/donation/common/history",
                icon: "📊",
                title: "기부 내역",
                desc: "나의 기부 히스토리",
              },
              {
                href: "/donation/common/certificates",
                icon: "🏆",
                title: "기부 증명서",
                desc: "세금 공제용 증명서",
              },
              {
                href: "/donation/common/impact",
                icon: "📈",
                title: "임팩트 리포트",
                desc: "기부 효과 확인",
              },
              {
                href: "/donation/common/settings",
                icon: "⚙️",
                title: "설정",
                desc: "알림 및 환경설정",
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group text-center p-6 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border hover:border-gray-300 transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </div>
                <div className="text-sm text-gray-600">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
