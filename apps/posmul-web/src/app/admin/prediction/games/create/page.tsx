"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Target,
  Sparkles,
  Radar,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import {
  DEFAULT_REGION_PRESETS,
  REGION_LEVEL_OPTIONS,
  type RegionHierarchyLevel,
} from "@/bounded-contexts/prediction/domain/value-objects/region-hierarchy";

type OracleSourceType =
  | "manual"
  | "rss_ai"
  | "kr_public"
  | "coingecko"
  | "alpha-vantage"
  | "fmp"
  | "ecos"
  | "kosis"
  | "dart"
  | "kobis"
  | "kcontent"
  | "football_data";

interface OraclePreviewState {
  supported: boolean;
  resolved: boolean;
  winningOptionId: string | null;
  confidence: number;
  rationale?: string;
  sourceData: Record<string, unknown>;
}

const SUBCATEGORY_BY_CATEGORY: Record<string, Array<{ value: string; label: string }>> = {
  POLITICS: [
    { value: "domestic", label: "국내 정치" },
    { value: "bills", label: "국회 의안·법안" },
    { value: "policy", label: "정부 정책·제도" },
    { value: "global", label: "국제 외교" },
  ],
  ECONOMY: [
    { value: "crypto", label: "암호화폐" },
    { value: "stocks", label: "글로벌·국내 증시" },
    { value: "macro", label: "금리·환율·물가" },
    { value: "realestate", label: "부동산·통계" },
  ],
  INVEST: [
    { value: "earnings", label: "기업 실적·공시" },
    { value: "commodity", label: "원자재·금" },
    { value: "etf", label: "지수·ETF" },
  ],
  SPORTS: [
    { value: "soccer", label: "축구 (EPL/K리그/UCL)" },
    { value: "baseball", label: "야구 (KBO/MLB)" },
    { value: "basketball", label: "농구" },
    { value: "esports", label: "e스포츠" },
  ],
  ENTERTAINMENT: [
    { value: "movie", label: "영화 박스오피스" },
    { value: "drama", label: "드라마 시청률·OTT" },
    { value: "music", label: "음원 차트·가요" },
  ],
  CONSUME: [
    { value: "local", label: "로컬 소비 트렌드" },
    { value: "retail", label: "유통·물가" },
  ],
};

function buildOracleConfig(params: {
  sourceType: OracleSourceType;
  rssKeywords: string;
  rssMinConfidence: number;
  rssAllowAutoSettle: boolean;
  coinId: string;
  vsCurrency: "usd" | "krw";
  cryptoComparison: "threshold" | "change_direction";
  cryptoThreshold: number;
  stockSymbol: string;
  stockComparison: "daily_up" | "threshold";
  stockThreshold: number;
  advancedJson: string;
}): Record<string, unknown> {
  if (params.advancedJson.trim()) {
    try {
      return JSON.parse(params.advancedJson) as Record<string, unknown>;
    } catch {
      // 잘못된 JSON이면 아래 기본 폼 값 사용
    }
  }

  switch (params.sourceType) {
    case "rss_ai":
      return {
        keywords: params.rssKeywords,
        minConfidence: params.rssMinConfidence,
        allowAutoSettle: params.rssAllowAutoSettle,
      };
    case "coingecko":
      return {
        coinId: params.coinId,
        vsCurrency: params.vsCurrency,
        comparisonType: params.cryptoComparison,
        ...(params.cryptoComparison === "threshold"
          ? { threshold: params.cryptoThreshold }
          : {}),
      };
    case "alpha-vantage":
    case "fmp":
      return {
        symbol: params.stockSymbol.trim().toUpperCase(),
        mode: params.stockComparison,
        ...(params.stockComparison === "threshold"
          ? { threshold: params.stockThreshold }
          : {}),
      };
    default:
      return {};
  }
}

function OraclePreviewBox({
  preview,
  loading,
}: {
  preview: OraclePreviewState | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 text-xs text-sky-300">
        오라클 데이터를 실시간 조회하고 있습니다...
      </div>
    );
  }
  if (!preview) return null;

  const articles = Array.isArray(preview.sourceData?.evidenceArticles)
    ? (preview.sourceData.evidenceArticles as Array<{
        title?: string;
        link?: string;
        publishedAt?: string | null;
      }>)
    : [];

  return (
    <div
      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
        preview.resolved
          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
          : "bg-slate-950 border-slate-700 text-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold flex items-center gap-1.5">
          {preview.resolved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          {preview.resolved
            ? `현재 기준 판정 가능 (추천 옵션: ${preview.winningOptionId}, 신뢰도 ${Math.round(preview.confidence * 100)}%)`
            : "연결 확인됨 (아직 확정 조건 미도달 또는 대기 중)"}
        </span>
      </div>
      {preview.rationale && (
        <p className="text-[11px] text-slate-300 leading-relaxed">{preview.rationale}</p>
      )}
      {typeof preview.sourceData?.currentPrice === "number" && (
        <div className="text-[11px] font-mono text-amber-300">
          현재 시세: {Number(preview.sourceData.currentPrice).toLocaleString()} (
          {String(preview.sourceData.vsCurrency || "USD").toUpperCase()})
        </div>
      )}
      {articles.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/10">
          <div className="text-[11px] font-semibold text-sky-300">
            매칭된 최신 RSS 기사 ({articles.length}건):
          </div>
          {articles.slice(0, 3).map((a, idx) => (
            <a
              key={idx}
              href={a.link || "#"}
              target="_blank"
              rel="noreferrer"
              className="block text-[11px] text-slate-300 hover:text-sky-300 truncate underline-offset-2 hover:underline"
            >
              • {a.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreatePredictionGamePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // 기본 정보
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("POLITICS");
  const [subcategory, setSubcategory] = useState("domestic");
  const [options, setOptions] = useState<string[]>(["예 (Yes)", "아니오 (No)"]);
  const [minBet, setMinBet] = useState(100);
  const [maxBet, setMaxBet] = useState(10000);
  const [autoGenerateBriefing, setAutoGenerateBriefing] = useState(true);
  const [regionLevel, setRegionLevel] = useState<RegionHierarchyLevel>("NATION");
  const [regionCode, setRegionCode] = useState("KR");
  const [regionName, setRegionName] = useState("대한민국");

  // 오라클 설정
  const [sourceType, setSourceType] = useState<OracleSourceType>("rss_ai");
  const [rssKeywords, setRssKeywords] = useState("");
  const [rssMinConfidence, setRssMinConfidence] = useState(0.85);
  const [rssAllowAutoSettle, setRssAllowAutoSettle] = useState(false);
  const [coinId, setCoinId] = useState("bitcoin");
  const [vsCurrency, setVsCurrency] = useState<"usd" | "krw">("usd");
  const [cryptoComparison, setCryptoComparison] = useState<"threshold" | "change_direction">(
    "threshold"
  );
  const [cryptoThreshold, setCryptoThreshold] = useState(100000);
  const [stockSymbol, setStockSymbol] = useState("QQQ");
  const [stockComparison, setStockComparison] = useState<"daily_up" | "threshold">("daily_up");
  const [stockThreshold, setStockThreshold] = useState(500);
  const [externalId, setExternalId] = useState("");
  const [advancedJson, setAdvancedJson] = useState("");
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);

  // 오라클 테스트 프리뷰
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<OraclePreviewState | null>(null);

  // 날짜 설정
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const settleDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
  const [registrationEnd, setRegistrationEnd] = useState(endDate.toISOString().slice(0, 16));
  const [settlementDate, setSettlementDate] = useState(settleDate.toISOString().slice(0, 16));

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    const firstSub = SUBCATEGORY_BY_CATEGORY[nextCategory]?.[0]?.value ?? "";
    setSubcategory(firstSub);
  };

  const handleRegionLevelChange = (nextLevel: RegionHierarchyLevel) => {
    setRegionLevel(nextLevel);
    const firstPreset = DEFAULT_REGION_PRESETS.find((p) => p.level === nextLevel);
    if (firstPreset) {
      setRegionCode(firstPreset.code);
      setRegionName(firstPreset.name);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, `옵션 ${options.length + 1}`]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert("최소 2개 이상의 선택지가 필요합니다.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const getCurrentOracleConfig = () =>
    buildOracleConfig({
      sourceType,
      rssKeywords,
      rssMinConfidence,
      rssAllowAutoSettle,
      coinId,
      vsCurrency,
      cryptoComparison,
      cryptoThreshold,
      stockSymbol,
      stockComparison,
      stockThreshold,
      advancedJson,
    });

  const handleTestOracle = async () => {
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await fetch("/api/admin/prediction/oracle-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          sourceType,
          title: title || "오라클 연결 테스트",
          description,
          options,
          sourceConfig: getCurrentOracleConfig(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewResult(data.preview);
      } else {
        alert(`오라클 테스트 실패: ${data.error}`);
      }
    } catch (err) {
      alert(`오라클 테스트 오류: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 10) {
      alert("예측 게임 제목은 최소 10자 이상 입력해 주세요.");
      return;
    }
    if (options.some((opt) => !opt.trim())) {
      alert("모든 선택지를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/prediction/create-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          subcategory,
          options,
          minBetAmount: Number(minBet),
          maxBetAmount: Number(maxBet),
          registrationEnd: new Date(registrationEnd).toISOString(),
          settlementDate: new Date(settlementDate).toISOString(),
          sourceType,
          sourceConfig: getCurrentOracleConfig(),
          externalId: externalId.trim() || undefined,
          autoGenerateBriefing,
          regionLevel,
          regionCode: regionCode.trim() || undefined,
          regionName: regionName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          `🎉 예측 게임 등록 완료!\n- 오라클(${sourceType}) 연동: ${data.oracleRegistered ? "완료" : "수동"}\n- AI 균형 브리핑 생성: ${data.briefingGenerated ? "완료" : "대기(상세 진입 시 자동)"}`
        );
        router.push("/admin/prediction");
      } else {
        alert(`❌ 게임 생성 실패: ${data.error}`);
      }
    } catch (err) {
      alert(`오류 발생: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const subOptions = SUBCATEGORY_BY_CATEGORY[category] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <Link
            href="/admin/prediction"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin/prediction으로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">
            ORACLE-LINKED PREDICTION CREATOR
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-400" />
            오라클 직결형 예측 게임 생성
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            공식 API 오라클 또는 RSS AI 반자동 오라클과 3단계 균형 브리핑을 한 번에 연결해 공식 예측 게임을 발행합니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >
          {/* 제목 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
                예측 게임 제목 <span className="text-rose-400">*</span> (최소 10자)
              </label>
              <span className={`text-[11px] font-mono ${title.trim().length < 10 ? "text-amber-400" : "text-emerald-400"}`}>
                {title.trim().length} / 200자
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: [정치] 국회 본회의에서 이번 주 내 상법 개정안이 가결될까?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          {/* 카테고리 / 서브카테고리 / 베팅 범위 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">카테고리</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="POLITICS">🗳️ 정치 / 정책</option>
                <option value="ECONOMY">💰 경제 / 암호화폐</option>
                <option value="INVEST">📈 투자 / 기업</option>
                <option value="SPORTS">⚽ 스포츠 / 경기</option>
                <option value="ENTERTAINMENT">🎬 엔터 / 대중문화</option>
                <option value="CONSUME">🛒 소비 / 로컬</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">세부 분류</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {subOptions.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">최소 베팅금 (PMP)</label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">최대 베팅금 (PMP)</label>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 4단계 공간 계층 (지역 태깅) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/25">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 지역 스케일 태깅 (초기 진입: 구·군까지 주력 / 동은 확장형 유지)
              </h2>
              <span className="text-[11px] text-slate-400">
                필터 · 카드 배지 · 향후 지역 행사/커뮤니티 연동 기준
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">공간 단계</label>
                <select
                  value={regionLevel}
                  onChange={(e) => handleRegionLevelChange(e.target.value as RegionHierarchyLevel)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  {REGION_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">표준 지역 프리셋</label>
                <select
                  value={regionCode}
                  onChange={(e) => {
                    const nextCode = e.target.value;
                    setRegionCode(nextCode);
                    const found = DEFAULT_REGION_PRESETS.find((p) => p.code === nextCode);
                    if (found) setRegionName(found.name);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  {DEFAULT_REGION_PRESETS.filter((p) => p.level === regionLevel).map((preset) => (
                    <option key={preset.code} value={preset.code}>
                      {preset.name} ({preset.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">표시 지역명 (직접 수정 가능)</label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  placeholder="예: 광주 광산구, 서울 성동구"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 상세 배경 설명 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
                상세 배경 설명 및 정산 기준 (비워도 자동 보강, 20자 이상 권장)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {description.trim().length} / 2000자
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="정산 판정의 객관적 기준을 20자 이상 적으면 RSS AI 오라클과 균형 브리핑 품질이 크게 올라갑니다."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 오라클 연결 섹션 */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-sky-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-sky-300 flex items-center gap-1.5">
                  <Radar className="w-4 h-4" /> 정산 오라클 연결 (자동 / RSS AI 반자동)
                </h2>
                <p className="text-[11px] text-slate-400">
                  수치형은 API 자동 정산, 뉴스/이슈형은 RSS AI가 기사를 근거로 판정을 추천합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestOracle}
                disabled={previewLoading || sourceType === "manual"}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 text-sky-300 border border-sky-500/40 text-xs font-bold transition shrink-0"
              >
                ⚡ 오라클 연결 미리 테스트
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">오라클 타입</label>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    setSourceType(e.target.value as OracleSourceType);
                    setPreviewResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="rss_ai">🔍 RSS 뉴스 AI 반자동 추천 (rss_ai)</option>
                  <option value="kr_public">🗺️ 한국 공공데이터 오라클 (kr_public)</option>
                  <option value="coingecko">₿ CoinGecko 실시간 암호화폐 (자동)</option>
                  <option value="alpha-vantage">📈 AlphaVantage 미국·글로벌 주식 (자동)</option>
                  <option value="fmp">📊 FMP 글로벌 실적·주가 (자동)</option>
                  <option value="ecos">🏛️ 한국은행 ECOS 금리·환율 (자동)</option>
                  <option value="kosis">📑 통계청 KOSIS 국가통계 (자동)</option>
                  <option value="dart">🏢 금감원 OpenDART 공시 (자동)</option>
                  <option value="kobis">🎬 영진위 KOBIS 박스오피스 (자동)</option>
                  <option value="football_data">⚽ Football-Data 경기 결과 (자동)</option>
                  <option value="kcontent">📺 K-콘텐츠 시청률·차트 (반자동)</option>
                  <option value="manual">✍️ 수동 정산 (manual)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  외부 식별자 (External ID, 선택)
                </label>
                <input
                  type="text"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  placeholder="예: 경기 ID, 종목 티커, 법안 ID 등"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>

            {/* 오라클별 세부 입력 */}
            {sourceType === "rss_ai" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    RSS 기사 매칭 키워드 (쉼표 구분, 비우면 제목 핵심어 자동 추출)
                  </label>
                  <input
                    type="text"
                    value={rssKeywords}
                    onChange={(e) => setRssKeywords(e.target.value)}
                    placeholder="예: 상법 개정안, 국회 본회의, 가결"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    최소 추천 신뢰도
                  </label>
                  <select
                    value={rssMinConfidence}
                    onChange={(e) => setRssMinConfidence(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value={0.75}>75% 이상</option>
                    <option value={0.85}>85% 이상 (권장)</option>
                    <option value={0.95}>95% 이상 (보수적)</option>
                  </select>
                </div>
                <label className="sm:col-span-3 flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rssAllowAutoSettle}
                    onChange={(e) => setRssAllowAutoSettle(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  신뢰도 충족 시 관리자 승인 없이 크론 자동 정산 허용 (비체크 시 정산 센터에서 AI 추천 확인 후 1클릭 승인)
                </label>
              </div>
            )}

            {sourceType === "coingecko" && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">코인 ID</label>
                  <select
                    value={coinId}
                    onChange={(e) => setCoinId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="bitcoin">bitcoin (BTC)</option>
                    <option value="ethereum">ethereum (ETH)</option>
                    <option value="solana">solana (SOL)</option>
                    <option value="ripple">ripple (XRP)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">기준 통화</label>
                  <select
                    value={vsCurrency}
                    onChange={(e) => setVsCurrency(e.target.value as "usd" | "krw")}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="usd">USD ($)</option>
                    <option value="krw">KRW (₩)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">판정 방식</label>
                  <select
                    value={cryptoComparison}
                    onChange={(e) =>
                      setCryptoComparison(e.target.value as "threshold" | "change_direction")
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="threshold">목표가 돌파 여부</option>
                    <option value="change_direction">24시간 등락 방향</option>
                  </select>
                </div>
                {cryptoComparison === "threshold" && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      목표 가격
                    </label>
                    <input
                      type="number"
                      value={cryptoThreshold}
                      onChange={(e) => setCryptoThreshold(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                )}
              </div>
            )}

            {(sourceType === "alpha-vantage" || sourceType === "fmp") && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">종목 티커</label>
                  <input
                    type="text"
                    value={stockSymbol}
                    onChange={(e) => setStockSymbol(e.target.value)}
                    placeholder="QQQ, SPY, AAPL, NVDA"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">비교 방식</label>
                  <select
                    value={stockComparison}
                    onChange={(e) =>
                      setStockComparison(e.target.value as "daily_up" | "threshold")
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="daily_up">전일 대비 상승/하락</option>
                    <option value="threshold">목표 종가 돌파</option>
                  </select>
                </div>
                {stockComparison === "threshold" && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      목표 주가
                    </label>
                    <input
                      type="number"
                      value={stockThreshold}
                      onChange={(e) => setStockThreshold(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedJson((v) => !v)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                {showAdvancedJson ? "고급 SourceConfig JSON 닫기" : "고급 SourceConfig JSON 직접 입력 (ECOS/KOSIS/DART/KOBIS용)"}
              </button>
              {showAdvancedJson && (
                <textarea
                  value={advancedJson}
                  onChange={(e) => setAdvancedJson(e.target.value)}
                  rows={3}
                  placeholder='{"statCode": "722Y001", "threshold": 3.0}'
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200"
                />
              )}
            </div>

            <OraclePreviewBox preview={previewResult} loading={previewLoading} />
          </div>

          {/* 선택지 */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-200">
                🎯 예측 선택지 (Options — 2개일 경우 자동 yes/no 매핑)
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" /> 선택지 추가
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`선택지 ${idx + 1}`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 일정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> 예측 참여 마감일
              </label>
              <input
                type="datetime-local"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> 결과 승부 정산일
              </label>
              <input
                type="datetime-local"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 브리핑 & 제출 */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerateBriefing}
                onChange={(e) => setAutoGenerateBriefing(e.target.checked)}
                className="rounded border-slate-700"
              />
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              생성 즉시 3단계 균형 브리핑(AI 분석) 자동 생성
            </label>

            <div className="flex justify-end gap-3">
              <Link
                href="/admin/prediction"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {submitting ? "등록 중..." : "🚀 오라클 연동 게임 등록"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
