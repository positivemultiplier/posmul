"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
    getFeedStats,
    getFeedItems,
    getBills,
    publishToPredictionGame,
    ignoreFeedItem,
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
} from "lucide-react";

export default function AdminFeedPage() {
    const [stats, setStats] = useState<FeedStatsDTO>({
        totalItems: 0,
        predictionCandidates: 0,
        publishedGames: 0,
        totalBills: 0,
    });
    const [activeTab, setActiveTab] = useState<"drafts" | "bills" | "all">("drafts");
    const [feedItems, setFeedItems] = useState<FeedItemDTO[]>([]);
    const [bills, setBills] = useState<BillDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // 모달 상태
    const [selectedItem, setSelectedItem] = useState<FeedItemDTO | null>(null);
    const [modalTitle, setModalTitle] = useState("");
    const [modalDescription, setModalDescription] = useState("");
    const [modalCategory, setModalCategory] = useState("POLITICS");
    const [modalDays, setModalDays] = useState(7);
    const [modalOption1, setModalOption1] = useState("찬성 / 실현된다");
    const [modalOption2, setModalOption2] = useState("반대 / 실현되지 않는다");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [s, items, b] = await Promise.all([
                getFeedStats(),
                getFeedItems({ limit: 60 }),
                getBills(30),
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
        loadData();
    }, []);

    // 빠른 즉시 발행 (One-Click Publish)
    const handleQuickPublish = (item: FeedItemDTO) => {
        if (!confirm(`'${item.title}' 기사를 기반으로 예측 게임을 즉시 발행하시겠습니까?`)) {
            return;
        }

        startTransition(async () => {
            const res = await publishToPredictionGame({
                feedItemId: item.id,
                title: item.title,
                description: `${item.content_summary || item.title}\n\n[출처]\n${item.link}`,
                category: "POLITICS",
                durationDays: 7,
                sourceUrl: item.link,
            });

            if (res.success) {
                setStatusMessage(`✅ 예측 게임이 성공적으로 등록되었습니다! (ID: ${res.gameId})`);
                await loadData();
            } else {
                alert(`발행 실패: ${res.error}`);
            }
        });
    };

    // 모달 열기 (상세 편집 후 발행)
    const openEditModal = (item: FeedItemDTO) => {
        setSelectedItem(item);
        setModalTitle(item.title);
        setModalDescription(item.content_summary || item.title);
        setModalCategory("POLITICS");
        setModalDays(7);
        setModalOption1("찬성 / 가결된다");
        setModalOption2("반대 / 부결된다");
        setIsModalOpen(true);
    };

    // 의안으로 게임 생성 모달 열기
    const openBillModal = (bill: BillDTO) => {
        setSelectedItem(null);
        setModalTitle(`[국회 의안] ${bill.bill_name} 본회의 통과 여부`);
        setModalDescription(
            `제안자: ${bill.proposer || "미상"}\n소관위원회: ${bill.committee || "미상"}\n의안번호: ${bill.bill_no}\n현재 심의상태: ${bill.rgs_conf_rslt || bill.proc_result || "심의 중"}`
        );
        setModalCategory("POLITICS");
        setModalDays(14);
        setModalOption1("가결 (통과)");
        setModalOption2("부결 또는 임기만료 폐기");
        setIsModalOpen(true);
    };

    // 모달 제출
    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await publishToPredictionGame({
                feedItemId: selectedItem?.id,
                title: modalTitle,
                description: modalDescription,
                category: modalCategory,
                durationDays: modalDays,
                options: [
                    { id: "opt_1", label: modalOption1 },
                    { id: "opt_2", label: modalOption2 },
                ],
                sourceUrl: selectedItem?.link,
            });

            if (res.success) {
                setIsModalOpen(false);
                setStatusMessage("✅ 정식 예측 게임으로 발행되었습니다!");
                await loadData();
            } else {
                alert(`발행 오류: ${res.error}`);
            }
        });
    };

    // 제외/보관 처리
    const handleIgnore = (item: FeedItemDTO) => {
        startTransition(async () => {
            await ignoreFeedItem(item.id);
            setStatusMessage("기사가 목록에서 제외(보관)되었습니다.");
            await loadData();
        });
    };

    // AI 수집 파이프라인 트리거
    const handleTriggerIngest = async () => {
        if (!confirm("새로운 RSS 뉴스 및 국회 의안을 즉시 수집하고 AI 분류를 실행할까요? (약 10~20초 소요)")) {
            return;
        }
        setIsLoading(true);
        setStatusMessage("🤖 AI 콘텐츠 수집 파이프라인을 실행 중입니다...");
        try {
            const res = await fetch("/api/ingest");
            const data = await res.json();
            setStatusMessage("🎉 수집 및 AI 분류가 완료되었습니다!");
            await loadData();
        } catch (e: any) {
            alert(`수집 실행 실패: ${e?.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // 필터링된 예측 추천 목록
    const draftCandidates = feedItems.filter(
        (i) => i.ai_classification === "PREDICTION" && i.process_status !== "PUBLISHED" && i.process_status !== "IGNORED"
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* 상단 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md">
                            🤖
                        </span>
                        AI 콘텐츠 파이프라인 & 초안 관리
                    </h1>
                    <p className="text-gray-500 mt-1">
                        대한민국 정책브리핑 RSS 및 국회 의안 API로부터 수집된 데이터를 AI로 검토하고 즉시 예측 게임으로 발행합니다.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        새로고침
                    </button>
                    <button
                        onClick={handleTriggerIngest}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI 즉시 수집/분류 실행
                    </button>
                </div>
            </div>

            {/* 알림 메시지 */}
            {statusMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium">{statusMessage}</span>
                    </div>
                    <button
                        onClick={() => setStatusMessage(null)}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-bold"
                    >
                        닫기
                    </button>
                </div>
            )}

            {/* 통계 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">수집된 정책 뉴스</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalItems}건</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between bg-gradient-to-br from-indigo-50/50 to-white">
                    <div>
                        <p className="text-sm font-medium text-indigo-600">AI 예측 게임 추천 후보</p>
                        <p className="text-3xl font-bold text-indigo-950 mt-1">{stats.predictionCandidates}건</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">연동된 국회 의안</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBills}건</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Vote className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">정식 게임 발행 완료</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.publishedGames}건</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200 space-x-8">
                <button
                    onClick={() => setActiveTab("drafts")}
                    className={`pb-4 px-2 font-semibold text-base transition flex items-center gap-2 border-b-2 ${
                        activeTab === "drafts"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Sparkles className="w-5 h-5" />
                    AI 추천 예측 초안 ({draftCandidates.length})
                </button>
                <button
                    onClick={() => setActiveTab("bills")}
                    className={`pb-4 px-2 font-semibold text-base transition flex items-center gap-2 border-b-2 ${
                        activeTab === "bills"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Vote className="w-5 h-5" />
                    국회 의안 모니터링 ({bills.length})
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={`pb-4 px-2 font-semibold text-base transition flex items-center gap-2 border-b-2 ${
                        activeTab === "all"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Layers className="w-5 h-5" />
                    수집 피드 전체 ({feedItems.length})
                </button>
            </div>

            {/* 탭 1: AI 추천 예측 게임 초안 목록 */}
            {activeTab === "drafts" && (
                <div className="space-y-6">
                    {draftCandidates.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-800">현재 대기 중인 AI 추천 초안이 없습니다</h3>
                            <p className="text-gray-500 mt-1 text-sm">
                                상단의 [AI 즉시 수집/분류 실행] 버튼을 눌러 새로운 정책 뉴스를 가져와 보세요!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {draftCandidates.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                예측 추천
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(item.created_at).toLocaleDateString("ko-KR")}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                                            {item.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                            {item.content_summary || "요약 데이터가 없습니다."}
                                        </p>

                                        <div className="pt-2">
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                원문 기사 확인하기 (korea.kr)
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* 카드 액션 버튼들 */}
                                    <div className="pt-6 mt-4 border-t border-gray-100 flex items-center gap-2">
                                        <button
                                            onClick={() => handleQuickPublish(item)}
                                            disabled={isPending}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            즉시 발행
                                        </button>
                                        <button
                                            onClick={() => openEditModal(item)}
                                            disabled={isPending}
                                            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
                                            title="옵션 및 설명 편집 후 발행"
                                        >
                                            <SlidersHorizontal className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleIgnore(item)}
                                            disabled={isPending}
                                            className="px-3.5 py-2.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-xl text-sm transition"
                                            title="제외/보관"
                                        >
                                            <EyeOff className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 탭 2: 국회 의안 목록 */}
            {activeTab === "bills" && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800">제22대 국회 주요 의안 현황</h3>
                            <p className="text-xs text-gray-500 mt-0.5">열린국회정보 Open API와 실시간 연동된 의안 목록입니다.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-3.5">의안번호</th>
                                    <th className="px-6 py-3.5">법안명</th>
                                    <th className="px-6 py-3.5">제안자</th>
                                    <th className="px-6 py-3.5">소관위원회</th>
                                    <th className="px-6 py-3.5">본회의 심의결과</th>
                                    <th className="px-6 py-3.5 text-right">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bills.map((bill) => (
                                    <tr key={bill.bill_id} className="hover:bg-gray-50/80 transition">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-800">
                                            {bill.bill_no}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 max-w-md">
                                            {bill.bill_name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {bill.proposer || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {bill.committee || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                {bill.rgs_conf_rslt || bill.proc_result || "심의 계류 중"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openBillModal(bill)}
                                                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition"
                                            >
                                                예측 게임 생성
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 탭 3: 전체 피드 목록 */}
            {activeTab === "all" && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-3.5">수집일자</th>
                                    <th className="px-6 py-3.5">기사 제목</th>
                                    <th className="px-6 py-3.5">AI 분류</th>
                                    <th className="px-6 py-3.5">처리 상태</th>
                                    <th className="px-6 py-3.5 text-right">바로가기</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {feedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition">
                                        <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString("ko-KR")}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 max-w-lg">
                                            {item.title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    item.ai_classification === "PREDICTION"
                                                        ? "bg-indigo-50 text-indigo-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {item.ai_classification || "미분류"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    item.process_status === "PUBLISHED"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : item.process_status === "IGNORED"
                                                        ? "bg-gray-100 text-gray-400"
                                                        : "bg-blue-50 text-blue-700"
                                                }`}
                                            >
                                                {item.process_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1"
                                            >
                                                링크
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 예측 게임 편집 및 발행 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                <span>🚀</span>
                                예측 게임 발행 설정
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleModalSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    예측 게임 제목
                                </label>
                                <input
                                    type="text"
                                    value={modalTitle}
                                    onChange={(e) => setModalTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    상세 설명 및 판정 기준
                                </label>
                                <textarea
                                    rows={4}
                                    value={modalDescription}
                                    onChange={(e) => setModalDescription(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        카테고리
                                    </label>
                                    <select
                                        value={modalCategory}
                                        onChange={(e) => setModalCategory(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                                    >
                                        <option value="POLITICS">정치 / 정책</option>
                                        <option value="ECONOMY">경제 / 금융</option>
                                        <option value="SPORTS">스포츠</option>
                                        <option value="ENTERTAINMENT">엔터테인먼트</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        참여 기간 (마감일)
                                    </label>
                                    <select
                                        value={modalDays}
                                        onChange={(e) => setModalDays(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                                    >
                                        <option value={3}>3일 후 마감</option>
                                        <option value={7}>7일 후 마감 (기본)</option>
                                        <option value={14}>14일 후 마감</option>
                                        <option value={30}>30일 후 마감</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        선택지 1 (Option A)
                                    </label>
                                    <input
                                        type="text"
                                        value={modalOption1}
                                        onChange={(e) => setModalOption1(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        선택지 2 (Option B)
                                    </label>
                                    <input
                                        type="text"
                                        value={modalOption2}
                                        onChange={(e) => setModalOption2(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition disabled:opacity-50"
                                >
                                    {isPending ? "발행 중..." : "정식 게임으로 발행하기"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
