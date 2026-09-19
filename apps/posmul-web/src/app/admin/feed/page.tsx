"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  getFeedStats,
  getFeedItems,
  getBills,
  publishToPredictionGame,
  ignoreFeedItem,
  autoSettleBillsAction,
  fetchFeedsByCategoryAction,
  fetchMarketIndicatorsAction,
  fetchBoxOfficeAction,
  fetchBillsAction,
  fetchAllFeedsAction,
  generateAiDraftForFeedItemAction,
  FeedItemDTO,
  BillDTO,
  FeedStatsDTO,
  PublishGameInput,
} from "./actions";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  Send,
  EyeOff,
  SlidersHorizontal,
  Layers,
  TrendingUp,
  Vote,
  AlertCircle,
  Coins,
  Activity,
  Film,
  Zap,
  DollarSign,
  Tv,
} from "lucide-react";

type CategoryFilter = "ALL" | "BILLS" | "SPORTS" | "ECONOMY" | "ENTERTAINMENT" | "POLICY";

export default function AdminFeedPage() {
  const [stats, setStats] = useState<FeedStatsDTO>({
    totalItems: 0,
    predictionCandidates: 0,
    publishedGames: 0,
    totalBills: 0,
    categoryCounts: { ALL: 0, SPORTS: 0, ECONOMY: 0, ENTERTAINMENT: 0, POLICY: 0 },
  });
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [feedItems, setFeedItems] = useState<FeedItemDTO[]>([]);
  const [bills, setBills] = useState<BillDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 모달 상태
  const [selectedItem, setSelectedItem] = useState<FeedItemDTO | null>(null);
  const [selectedBill, setSelectedBill] = useState<BillDTO | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalCategory, setModalCategory] = useState("POLITICS");
  const [modalDays, setModalDays] = useState(7);
  const [modalOption1, setModalOption1] = useState("찬성 / 실현된다");
  const [modalOption2, setModalOption2] = useState("반대 / 실현되지 않는다");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const loadData = async (cat: CategoryFilter = activeCategory) => {
    setIsLoading(true);
    try {
      const [s, items, b] = await Promise.all([
        getFeedStats(),
        getFeedItems({
          category: cat === "BILLS" ? undefined : cat,
          limit: 100,
        }),
        getBills(50),
      ]);
      setStats(s);
      setFeedItems(items);
      setBills(b);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeCategory);
  }, [activeCategory]);

  // 카테고리 전환
  const handleCategoryChange = (cat: CategoryFilter) => {
    setActiveCategory(cat);
  };

  // 수집 액션 핸들러들
  const handleTriggerCollect = async (
    type: "ALL" | "SPORTS" | "ECONOMY" | "ENTERTAINMENT" | "MARKET" | "BILLS"
  ) => {
    setIsFetching(true);
    setStatusMessage("수집 엔진이 동작 중입니다...");
    try {
      let res: { success: boolean; message: string };
      if (type === "ALL") {
        res = await fetchAllFeedsAction();
      } else if (type === "SPORTS") {
        res = await fetchFeedsByCategoryAction("SPORTS");
      } else if (type === "ECONOMY") {
        res = await fetchFeedsByCategoryAction("ECONOMY");
      } else if (type === "ENTERTAINMENT") {
        res = await fetchFeedsByCategoryAction("ENTERTAINMENT");
      } else if (type === "MARKET") {
        res = await fetchMarketIndicatorsAction();
      } else {
        res = await fetchBillsAction();
      }

      setStatusMessage(res.message);
      await loadData();
    } catch (e: any) {
      setStatusMessage(`❌ 수집 실패: ${e?.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // 모달 열기 (기사 피드)
  const openItemModal = (item: FeedItemDTO) => {
    setSelectedItem(item);
    setSelectedBill(null);
    setModalTitle(item.title);
    setModalDescription(
      item.content_summary ||
        `${item.title} 관련 예측 게임입니다.\n\n[출처]\n${item.link}`
    );

    // 도메인에 맞는 기본 카테고리 & 옵션 추천
    const cat = item.source_category || "POLICY";
    if (cat === "SPORTS") {
      setModalCategory("SPORTS");
      setModalOption1("A팀 승리 / 달성");
      setModalOption2("B팀 승리 / 미달");
    } else if (cat === "ECONOMY") {
      setModalCategory("INVEST");
      setModalOption1("상승 / 목표 돌파");
      setModalOption2("하락 / 돌파 실패");
    } else if (cat === "ENTERTAINMENT") {
      setModalCategory("ENTERTAINMENT");
      setModalOption1("1위 / 기준 시청률 돌파");
      setModalOption2("순위 하락 / 기준 미달");
    } else {
      setModalCategory("POLITICS");
      setModalOption1("가결 / 실현된다");
      setModalOption2("부결 / 실현되지 않는다");
    }

    setModalDays(7);
    setIsModalOpen(true);
  };

  // 모달 열기 (의안 피드)
  const openBillModal = (bill: BillDTO) => {
    setSelectedBill(bill);
    setSelectedItem(null);
    setModalTitle(`[의안 심의 예측] ${bill.bill_name} (의안번호 ${bill.bill_no}) 본회의 가결될까?`);
    setModalDescription(
      `의안번호: ${bill.bill_no}\n제안자: ${bill.proposer || "미정"}\n소관위원회: ${
        bill.committee || "미정"
      }\n현재상태: ${bill.proc_result || "심사의뢰"}\n\n국회 본회의 최종 심의에서 원안가결 또는 수정가결될 것인지 예측합니다.`
    );
    setModalCategory("POLITICS");
    setModalOption1("가결 (원안/수정가결)");
    setModalOption2("부결 / 폐기 / 철회");
    setModalDays(14);
    setIsModalOpen(true);
  };

  // AI 자동 분석 및 옵션 초안 생성
  const handleGenerateAiDraft = async () => {
    if (!selectedItem) return;
    setIsAiDrafting(true);
    try {
      const res = await generateAiDraftForFeedItemAction(selectedItem.id);
      if (res.success && res.draft) {
        setModalTitle(res.draft.title);
        setModalDescription(
          `${res.draft.summary}\n\n[판정 기준]\n${res.draft.resolutionCriteria}\n\n[출처]\n${selectedItem.link}`
        );
        if (res.draft.options.length >= 2) {
          setModalOption1(res.draft.options[0]);
          setModalOption2(res.draft.options[1]);
        }
        setStatusMessage("✨ Gemini AI가 도메인에 특화된 예측 문항과 판정 기준을 완성했습니다!");
      } else {
        alert(`AI 초안 생성 실패: ${res.error}`);
      }
    } catch (e: any) {
      alert(`오류: ${e?.message}`);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // 정식 발행 제출
  const handleSubmitPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      alert("게임 제목을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      const input: PublishGameInput = {
        feedItemId: selectedItem?.id,
        billId: selectedBill?.bill_id,
        billNo: selectedBill?.bill_no,
        title: modalTitle,
        description: modalDescription,
        category: modalCategory,
        durationDays: modalDays,
        options: [
          { id: "opt_1", label: modalOption1 },
          { id: "opt_2", label: modalOption2 },
        ],
        sourceUrl: selectedItem?.link || (selectedBill ? `https://likms.assembly.go.kr` : undefined),
      };

      const res = await publishToPredictionGame(input);
      if (res.success) {
        setIsModalOpen(false);
        setStatusMessage(`🎉 예측 게임이 성공적으로 정식 발행되었습니다! (게임 ID: ${res.gameId})`);
        await loadData();
      } else {
        alert(`발행 실패: ${res.error}`);
      }
    });
  };

  // 기사 제외(무시) 처리
  const handleIgnore = (feedItemId: string) => {
    if (!confirm("이 피드를 후보에서 제외하시겠습니까?")) return;
    startTransition(async () => {
      const res = await ignoreFeedItem(feedItemId);
      if (res.success) {
        setStatusMessage("피드가 제외 처리되었습니다.");
        await loadData();
      } else {
        alert(`처리 실패: ${res.error}`);
      }
    });
  };

  // 의안 자동 정산 실행
  const handleAutoSettle = async () => {
    if (!confirm("국회 본회의 처리 결과(rgs_conf_rslt)를 확인하고 해당하는 예측 게임들을 자동 정산하시겠습니까?")) {
      return;
    }
    startTransition(async () => {
      const res = await autoSettleBillsAction();
      if (res.success) {
        setStatusMessage(`⚡ 자동 정산 완료: ${JSON.stringify(res.data)}`);
        await loadData();
      } else {
        alert(`정산 실패: ${res.error}`);
      }
    });
  };

  // 카테고리 뱃지 헬퍼
  const getCategoryBadge = (cat?: string) => {
    switch (cat?.toUpperCase()) {
      case "SPORTS":
        return { label: "스포츠", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: "⚽" };
      case "ECONOMY":
        return { label: "경제/증권", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: "📈" };
      case "ENTERTAINMENT":
        return { label: "엔터/영화", bg: "bg-pink-500/10 text-pink-400 border-pink-500/30", icon: "🎬" };
      default:
        return { label: "정책/시사", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: "🏛️" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 헤더 & 통계 영역 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Channel Ingestion & AI Oracle</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            다채널 자동 수집 & 예측 발행 센터
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            스포츠, 경제/환율/코인, 영화/박스오피스, 국회 의안을 실시간 수집하고 AI 도메인 맞춤 예측 게임으로 발행합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 상태 메시지 알림 바 */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-blue-400 hover:text-white"
          >
            닫기
          </button>
        </div>
      )}

      {/* 실시간 다채널 수집 실행 컨트롤 바 (Ingestion Trigger Bar) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            실시간 다채널 원클릭 수집 트리거
          </span>
          <span className="text-xs text-slate-500">
            {isFetching ? "수집 진행 중..." : "버튼 클릭 시 외부 소스에서 최신 데이터를 즉시 동기화합니다"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleTriggerCollect("ALL")}
            disabled={isFetching}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            전체 통합 수집 (All)
          </button>

          <button
            onClick={() => handleTriggerCollect("SPORTS")}
            disabled={isFetching}
            className="px-3.5 py-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            ⚽ 스포츠 뉴스 수집
          </button>

          <button
            onClick={() => handleTriggerCollect("ECONOMY")}
            disabled={isFetching}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            📈 경제/증권 뉴스 수집
          </button>

          <button
            onClick={() => handleTriggerCollect("MARKET")}
            disabled={isFetching}
            className="px-3.5 py-2.5 rounded-xl bg-yellow-950/40 hover:bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
            💰 실시간 환율 & BTC 시세 수집
          </button>

          <button
            onClick={() => handleTriggerCollect("ENTERTAINMENT")}
            disabled={isFetching}
            className="px-3.5 py-2.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/30 text-pink-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Film className="w-3.5 h-3.5 text-pink-400" />
            🎬 영화/박스오피스 & 시청률 수집
          </button>

          <button
            onClick={() => handleTriggerCollect("BILLS")}
            disabled={isFetching}
            className="px-3.5 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Vote className="w-3.5 h-3.5 text-purple-400" />
            🏛️ 국회 의안 수집
          </button>
        </div>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>수집된 총 피드</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.totalItems}건</div>
          <div className="text-xs text-slate-500 mt-1">스포츠/경제/엔터/정책</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Vote className="w-4 h-4 text-purple-400" />
            <span>국회 의안 DB</span>
          </div>
          <div className="text-2xl font-black text-purple-300">{stats.totalBills}건</div>
          <div className="text-xs text-slate-500 mt-1">열린국회정보 본회의 연동</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>예측 후보 Draft</span>
          </div>
          <div className="text-2xl font-black text-yellow-400">{stats.predictionCandidates}건</div>
          <div className="text-xs text-slate-500 mt-1">AI 도메인 적합 판정 완료</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>발행된 정식 게임</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.publishedGames}건</div>
          <div className="text-xs text-slate-500 mt-1">플랫폼 라이브 베팅 중</div>
        </div>
      </div>

      {/* 카테고리 필터 탭 네비게이션 */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange("ALL")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeCategory === "ALL"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            🌟 전체 피드 ({stats.totalItems})
          </button>

          <button
            onClick={() => handleCategoryChange("SPORTS")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeCategory === "SPORTS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            ⚽ 스포츠 ({stats.categoryCounts.SPORTS || 0})
          </button>

          <button
            onClick={() => handleCategoryChange("ECONOMY")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeCategory === "ECONOMY"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            📈 경제/증권 ({stats.categoryCounts.ECONOMY || 0})
          </button>

          <button
            onClick={() => handleCategoryChange("ENTERTAINMENT")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeCategory === "ENTERTAINMENT"
                ? "bg-pink-600 text-white shadow-lg shadow-pink-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            🎬 영화/시청률 ({stats.categoryCounts.ENTERTAINMENT || 0})
          </button>

          <button
            onClick={() => handleCategoryChange("POLICY")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeCategory === "POLICY"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            📰 정책/사회 ({stats.categoryCounts.POLICY || 0})
          </button>

          <button
            onClick={() => handleCategoryChange("BILLS")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeCategory === "BILLS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            🏛️ 국회 의안 ({stats.totalBills})
          </button>
        </div>

        {/* 의안 탭일 때 자동 정산 버튼 노출 */}
        {activeCategory === "BILLS" && (
          <button
            onClick={handleAutoSettle}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            ⚡ 본회의 결과 기반 자동 정산 실행
          </button>
        )}
      </div>

      {/* 리스트 영역 */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          데이터를 불러오는 중입니다...
        </div>
      ) : activeCategory === "BILLS" ? (
        /* 국회 의안 목록 */
        <div className="space-y-4">
          {bills.map((bill) => (
            <div
              key={bill.bill_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    의안번호 {bill.bill_no}
                  </span>
                  <span className="text-xs text-slate-400">{bill.committee || "위원회 미정"}</span>
                  {bill.proc_result && (
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 font-semibold">
                      {bill.proc_result}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white truncate leading-snug">
                  {bill.bill_name}
                </h3>
                <p className="text-xs text-slate-400">
                  제안자: {bill.proposer || "미정"} | 심의결과: {bill.rgs_conf_rslt || "심의 대기 중"}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openBillModal(bill)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  예측 게임으로 발행
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 피드 아이템 목록 */
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              수집된 피드가 없습니다. 상단의 '수집' 버튼을 눌러 피드를 동기화해주세요.
            </div>
          ) : (
            feedItems.map((item) => {
              const badge = getCategoryBadge(item.source_category);
              const isPublished = item.process_status === "PUBLISHED";
              const isIgnored = item.process_status === "IGNORED";

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl bg-slate-900/70 border ${
                    isPublished
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : isIgnored
                      ? "border-slate-800 opacity-50"
                      : "border-slate-800 hover:border-blue-500/40"
                  } transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${badge.bg}`}>
                        {badge.icon} {badge.label}
                      </span>
                      <span className="text-xs text-slate-400">{item.source_title}</span>
                      {item.ai_classification && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {item.ai_classification === "PREDICTION" ? "🎯 예측 적합" : "💬 포럼 적합"}
                        </span>
                      )}
                      {isPublished && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 정식 발행 완료
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1 leading-snug">
                      {item.title}
                    </h3>

                    {item.content_summary && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.content_summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>{item.published_at ? new Date(item.published_at).toLocaleString() : "시간 미상"}</span>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        원문 보기 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isPublished && (
                      <>
                        <button
                          onClick={() => openItemModal(item)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          발행 설정 (AI 초안)
                        </button>
                        <button
                          onClick={() => handleIgnore(item.id)}
                          title="후보 제외"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 예측 게임 발행 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  정식 예측 게임 발행 설정
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI 도메인 가이드에 따라 질문, 판정 기준, 선택지를 구성합니다.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* AI 자동 초안 완성 버튼 (기사 모달일 때) */}
            {selectedItem && (
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
                <span className="text-xs text-blue-300">
                  도메인(스포츠/경제/엔터) 특화 Gemini AI로 최적의 옵션과 판정 기준을 자동 생성합니다.
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={isAiDrafting}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiDrafting ? "animate-spin" : ""}`} />
                  {isAiDrafting ? "분석 중..." : "AI 초안 자동 생성"}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitPublish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  예측 게임 제목 (질문)
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  상세 설명 및 판정 기준 (Settlement Criteria)
                </label>
                <textarea
                  rows={4}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">카테고리</label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="SPORTS">스포츠 (SPORTS)</option>
                    <option value="INVEST">경제/투자 (INVEST)</option>
                    <option value="ENTERTAINMENT">엔터테인먼트 (ENTERTAINMENT)</option>
                    <option value="POLITICS">정치/의안 (POLITICS)</option>
                    <option value="SOCIAL">사회 (SOCIAL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    베팅 마감 기간
                  </label>
                  <select
                    value={modalDays}
                    onChange={(e) => setModalDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={3}>3일 후 마감</option>
                    <option value={7}>7일 후 마감 (1주일)</option>
                    <option value={14}>14일 후 마감 (2주일)</option>
                    <option value={30}>30일 후 마감 (1개월)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-blue-400 mb-1">옵션 1 라벨</label>
                  <input
                    type="text"
                    value={modalOption1}
                    onChange={(e) => setModalOption1(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-pink-400 mb-1">옵션 2 라벨</label>
                  <input
                    type="text"
                    value={modalOption2}
                    onChange={(e) => setModalOption2(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isPending ? "발행 중..." : "정식 예측 게임으로 발행"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
