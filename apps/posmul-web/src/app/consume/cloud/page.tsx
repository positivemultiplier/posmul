"use client";

/**
 * CloudConsume Page
 *
 * 클라우드 펀딩을 통한 PMC 획득 페이지
 * - 창작 프로젝트 후원
 * - 펀딩 참여 리워드
 * - 펀딩액의 2% PMC 적립
 *
 * @since 2025-11
 */
import Link from "next/link";
import { useState } from "react";
import {
  useFundingProjects,
  useContributionHistory,
  useContribute,
  type FundingProject,
} from "@/bounded-contexts/consume/presentation/hooks/use-cloud-consume";

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, string> = {
  "전체": "☁️",
  "환경": "🌱",
  "영화": "🎬",
  "도서": "📚",
  "공연": "🎭",
  "식품": "🥕",
  "기술": "💻",
  "음악": "🎵",
  "게임": "🎮",
  "예술": "🎨",
};

const getCategoryIcon = (category: string): string => {
  return categoryIcons[category] ?? "☁️";
};

export default function CloudConsumePage() {
  // API hooks
  const { projects, categories, total, loading, error, filters, filterByCategory } = useFundingProjects();
  const { totalPmcEarned } = useContributionHistory({ limit: 100 });
  const { contribute, loading: contributeLoading, result: contributeResult, reset: resetContribute } = useContribute();

  // UI State
  const [selectedProject, setSelectedProject] = useState<FundingProject | null>(null);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("");
  const [fundingSuccess, setFundingSuccess] = useState(false);

  // 펀딩 처리
  const handleFunding = async () => {
    if (!selectedProject || !fundingAmount) return;
    
    try {
      await contribute(selectedProject.id, Number(fundingAmount));
      setFundingSuccess(true);
      setFundingAmount("");
    } catch {
      // Error handled by hook
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowFundingModal(false);
    setSelectedProject(null);
    setFundingAmount("");
    setFundingSuccess(false);
    resetContribute();
  };

  // 모든 카테고리 목록 생성 (전체 포함)
  const allCategories = ["전체", ...categories];

  // 총 후원 금액 계산
  const totalFunded = projects.reduce((sum, p) => sum + p.currentAmount, 0);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/consume"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Consume
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">☁️ CloudConsume</h1>
          <p className="text-gray-600 mt-2">
            창작 프로젝트를 후원하고 PMC를 획득하세요
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">총 획득 PMC</div>
          <div className="text-2xl font-bold text-emerald-600">+{totalPmcEarned.toLocaleString()} PMC</div>
        </div>
      </div>

      {/* PMC Info Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">
              🎁 펀딩 참여로 PMC 획득 + 리워드 혜택
            </h2>
            <p className="text-emerald-100 text-sm">
              CloudConsume으로 획득한 PMC는 바로 Donation에 사용 가능합니다.
              <br />
              프로젝트 성공 시 얼리버드 리워드도 함께 받으세요!
            </p>
          </div>
          <Link
            href="/donation"
            className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex-shrink-0"
          >
            기부하러 가기 →
          </Link>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => filterByCategory(cat === "전체" ? undefined : cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              (cat === "전체" && !filters.category) || filters.category === cat
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{getCategoryIcon(cat)}</span>
            <span className="font-medium">{cat}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          {/* Project List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              🚀 진행 중인 프로젝트 <span className="text-gray-500 text-sm font-normal">({total}개)</span>
            </h2>
            <div className="space-y-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setShowFundingModal(true);
                  }}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="w-48 bg-gray-100 flex items-center justify-center text-6xl flex-shrink-0">
                      {getCategoryIcon(project.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                              {project.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              project.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-700' 
                                : project.status === 'FUNDED' 
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {project.status === 'ACTIVE' ? '진행중' : project.status === 'FUNDED' ? '달성' : project.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            {project.title}
                          </h3>
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">PMC 적립률</div>
                          <div className="text-xl font-bold text-emerald-600">
                            {(project.pmcRewardRate * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-semibold text-emerald-600">
                            {project.progress}% 달성
                          </span>
                          <span className="text-gray-500">
                            {(project.currentAmount / 10000).toLocaleString()}만원 /{" "}
                            {(project.targetAmount / 10000).toLocaleString()}만원
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(project.progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>👥 {project.contributorCount.toLocaleString()}명 참여</span>
                        <span>⏰ {project.daysLeft}일 남음</span>
                        <span className="text-xs text-gray-400">
                          최소 {project.minContribution.toLocaleString()}원 ~ 최대 {project.maxContribution.toLocaleString()}원
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setShowFundingModal(true);
                          }}
                          className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                          펀딩 참여하기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">☁️</div>
                  <p>등록된 프로젝트가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* How It Works */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold mb-4">💡 CloudConsume 장점</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🎁</div>
            <div className="font-medium mb-1">얼리버드 리워드</div>
            <div className="text-sm text-gray-500">
              펀딩 성공 시 일반 구매보다 저렴하게 제품/서비스 획득
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium mb-1">PMC 적립</div>
            <div className="text-sm text-gray-500">
              펀딩 금액의 1.8~2.5% PMC 자동 적립
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">❤️</div>
            <div className="font-medium mb-1">창작자 지원</div>
            <div className="text-sm text-gray-500">
              독립 창작자와 사회적 기업 직접 지원
            </div>
          </div>
        </div>
      </div>

      {/* Funding Modal */}
      {showFundingModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            {fundingSuccess && contributeResult ? (
              // 펀딩 성공 화면
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">펀딩 완료!</h3>
                <p className="text-gray-600 mb-4">
                  {contributeResult.projectTitle} 프로젝트에 참여해주셔서 감사합니다!
                </p>
                <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">획득한 PMC</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    +{contributeResult.pmcEarned.toLocaleString()} PMC
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    펀딩액: {contributeResult.amount.toLocaleString()}원
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-6">
                  <div className="text-sm text-gray-600 mb-1">프로젝트 현황</div>
                  <div className="text-lg font-semibold text-emerald-600">
                    {contributeResult.projectProgress.progress}% 달성
                  </div>
                  <div className="text-xs text-gray-500">
                    {contributeResult.projectProgress.contributorCount}명 참여
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  확인
                </button>
              </div>
            ) : (
              // 펀딩 입력 화면
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">☁️ 펀딩 참여하기</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                      {getCategoryIcon(selectedProject.category)}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedProject.title}</div>
                      <div className="text-sm text-gray-500">{selectedProject.category}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">달성률</span>
                      <span className="font-medium text-emerald-600">{selectedProject.progress}%</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">참여자</span>
                      <span className="font-medium">{selectedProject.contributorCount}명</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    펀딩 금액
                  </label>
                  <input
                    type="number"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    placeholder={`${selectedProject.minContribution.toLocaleString()}원 ~ ${selectedProject.maxContribution.toLocaleString()}원`}
                    min={selectedProject.minContribution}
                    max={selectedProject.maxContribution}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    최소 {selectedProject.minContribution.toLocaleString()}원 ~ 최대 {selectedProject.maxContribution.toLocaleString()}원
                  </div>
                </div>

                {fundingAmount && (
                  <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">예상 PMC 적립</span>
                      <span className="font-bold text-emerald-600">
                        +{Math.floor(Number(fundingAmount) * selectedProject.pmcRewardRate).toLocaleString()} PMC
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      적립률: {(selectedProject.pmcRewardRate * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                <button
                  onClick={handleFunding}
                  disabled={!fundingAmount || 
                    Number(fundingAmount) < selectedProject.minContribution || 
                    Number(fundingAmount) > selectedProject.maxContribution || 
                    contributeLoading}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {contributeLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> 처리 중...
                    </span>
                  ) : (
                    "펀딩하기"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
