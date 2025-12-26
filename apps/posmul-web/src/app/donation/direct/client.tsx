"use client";

import { useState } from "react";
import Link from "next/link";

// ===== 타입 정의 =====
interface CategoryInfo {
  category: string;
  label: string;
  icon: string;
}

interface DonationItem {
  id: string;
  donorUserId: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  condition: string;
  conditionLabel: string;
  quantity: number;
  estimatedValue: number;
  images: string[];
  pickupLocation: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  createdAt: string;
}

interface Recipient {
  id: string;
  userId: string | null;
  displayName: string;
  bio: string;
  neededCategories: CategoryInfo[];
  locationCity: string;
  locationDistrict: string;
  isVerified: boolean;
  createdAt: string;
}

interface Stats {
  totalItems: number;
  availableItems: number;
  totalRecipients: number;
  categoryCounts: Array<{
    category: string;
    label: string;
    icon: string;
    count: number;
  }>;
}

interface DirectDonationClientProps {
  items: DonationItem[];
  recipients: Recipient[];
  stats: Stats;
  isLoggedIn: boolean;
  currentUserId: string | null;
}

// ===== 탭 타입 =====
type TabType = "items" | "recipients";

// ===== 메인 컴포넌트 =====
export function DirectDonationClient({
  items,
  recipients,
  stats,
  isLoggedIn,
}: DirectDonationClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  // 필터링된 물품
  const filteredItems = items.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (selectedCondition && item.condition !== selectedCondition) return false;
    return true;
  });

  // 필터링된 수혜자
  const filteredRecipients = selectedCategory
    ? recipients.filter((r) =>
      r.neededCategories.some((c) => c.category === selectedCategory)
    )
    : recipients;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <HeroSection stats={stats} isLoggedIn={isLoggedIn} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 탭 네비게이션 */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 카테고리 필터 */}
        <CategoryFilter
          categories={stats.categoryCounts}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* 조건 필터 (물품 탭에서만) */}
        {activeTab === "items" && (
          <ConditionFilter
            selectedCondition={selectedCondition}
            setSelectedCondition={setSelectedCondition}
          />
        )}

        {/* 물품 목록 */}
        {activeTab === "items" && (
          <ItemsGrid items={filteredItems} isLoggedIn={isLoggedIn} />
        )}

        {/* 수혜자 목록 */}
        {activeTab === "recipients" && (
          <RecipientsGrid recipients={filteredRecipients} />
        )}

        {/* 하단 링크 */}
        <div className="text-center mt-8">
          <Link
            href="/donation"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← 기부 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

// ===== Hero Section - Unified Purple Tone =====
function HeroSection({
  stats,
  isLoggedIn,
}: {
  stats: Stats;
  isLoggedIn: boolean;
}) {
  return (
    <div className="relative bg-gradient-to-r from-purple-600 to-violet-600 text-white py-12 px-4 overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/20 blur-[80px] rounded-full" />
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">📦 직접 기부 (물품)</h1>
        <p className="text-lg text-white/90 mb-6">
          사용하지 않는 물품을 필요한 분들께 직접 전달하세요
        </p>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <StatCard
            icon="📦"
            value={stats.totalItems}
            label="등록된 물품"
          />
          <StatCard
            icon="✅"
            value={stats.availableItems}
            label="기부 가능"
          />
          <StatCard
            icon="👥"
            value={stats.totalRecipients}
            label="수혜자"
          />
          <StatCard
            icon="🎁"
            value={stats.categoryCounts.length}
            label="카테고리"
          />
        </div>

        {/* 물품 등록 버튼 */}
        {isLoggedIn && (
          <Link
            href="/donation/direct/register"
            className="inline-flex items-center gap-2 mt-6 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
          >
            <span>➕</span>
            <span>물품 등록하기</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ===== 통계 카드 =====
function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  );
}

// ===== 탭 네비게이션 =====
function TabNavigation({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => setActiveTab("items")}
        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${activeTab === "items"
          ? "bg-purple-500 text-white"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
      >
        📦 기부 물품
      </button>
      <button
        onClick={() => setActiveTab("recipients")}
        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${activeTab === "recipients"
          ? "bg-purple-500 text-white"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
      >
        👥 수혜자 목록
      </button>
    </div>
  );
}

// ===== 카테고리 필터 =====
function CategoryFilter({
  categories,
  selectedCategory,
  setSelectedCategory,
}: {
  categories: Stats["categoryCounts"];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}) {
  const totalCount = categories.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        카테고리
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === null
            ? "bg-purple-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
        >
          전체 ({totalCount})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.category
              ? "bg-purple-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
          >
            {cat.icon} {cat.label} ({cat.count})
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== 상태(조건) 필터 =====
function ConditionFilter({
  selectedCondition,
  setSelectedCondition,
}: {
  selectedCondition: string | null;
  setSelectedCondition: (cond: string | null) => void;
}) {
  const conditions = [
    { value: "new", label: "새것" },
    { value: "like_new", label: "거의 새것" },
    { value: "good", label: "양호" },
    { value: "fair", label: "사용감 있음" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        물품 상태
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCondition(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCondition === null
            ? "bg-violet-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
        >
          전체
        </button>
        {conditions.map((cond) => (
          <button
            key={cond.value}
            onClick={() => setSelectedCondition(cond.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCondition === cond.value
              ? "bg-violet-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
          >
            {cond.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== 물품 그리드 =====
function ItemsGrid({
  items,
  isLoggedIn,
}: {
  items: DonationItem[];
  isLoggedIn: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl block mb-4">📦</span>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          등록된 물품이 없습니다.
        </p>
        {isLoggedIn && (
          <Link
            href="/donation/direct/register"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
          >
            첫 번째 물품을 등록해보세요 →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// ===== 물품 카드 =====
function ItemCard({ item }: { item: DonationItem }) {
  const statusColorMap: Record<string, string> = {
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Link
      href={`/donation/direct/item/${item.id}`}
      className="block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
    >
      {/* 이미지 또는 아이콘 */}
      <div className="bg-gradient-to-r from-purple-400 to-violet-500 p-6 text-center">
        <span className="text-5xl">{item.categoryIcon}</span>
      </div>

      {/* 내용 */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
            {item.title}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${statusColorMap[item.statusColor] || statusColorMap.gray
              }`}
          >
            {item.statusLabel}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            {item.categoryLabel}
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            {item.conditionLabel}
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            수량: {item.quantity}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            📍 {item.pickupLocation || "위치 미정"}
          </span>
          {item.estimatedValue > 0 && (
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              약 {item.estimatedValue.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ===== 수혜자 그리드 =====
function RecipientsGrid({ recipients }: { recipients: Recipient[] }) {
  if (recipients.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl block mb-4">👥</span>
        <p className="text-gray-500 dark:text-gray-400">
          해당 조건에 맞는 수혜자가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipients.map((recipient) => (
        <RecipientCard key={recipient.id} recipient={recipient} />
      ))}
    </div>
  );
}

// ===== 수혜자 카드 =====
function RecipientCard({ recipient }: { recipient: Recipient }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-teal-400 to-cyan-500 p-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl">👤</span>
          {recipient.isVerified && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              ✓ 인증됨
            </span>
          )}
        </div>
      </div>

      {/* 내용 */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {recipient.displayName}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {recipient.bio || "소개가 없습니다."}
        </p>

        <div className="mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            필요 물품:
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {recipient.neededCategories.map((cat) => (
              <span
                key={cat.category}
                className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-full"
              >
                {cat.icon} {cat.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            📍 {recipient.locationCity} {recipient.locationDistrict}
          </span>
        </div>
      </div>
    </div>
  );
}
