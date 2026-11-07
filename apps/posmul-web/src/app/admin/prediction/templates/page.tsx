"use client";

import React, { useState } from "react";
import { FileCode2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "../../components/shadcn-admin-ui";

interface OfficialTemplateItem {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  recurrence: "daily" | "weekly" | "monthly";
  oracleType: string;
  scheduleRule: string;
  importance: "medium" | "high" | "critical";
}

const OFFICIAL_TEMPLATES: OfficialTemplateItem[] = [
  {
    id: "us-nasdaq-daily",
    title: "[미국증시] 오늘 밤 나스닥 100(QQQ) 전일 대비 상승 마감할까?",
    category: "ECONOMY",
    subcategory: "stocks",
    recurrence: "daily",
    oracleType: "alpha-vantage",
    scheduleRule: "21:30 KST 마감 ➔ 익일 05:30 정산",
    importance: "high",
  },
  {
    id: "btc-weekly-target",
    title: "[암호화폐] 비트코인(BTC) 이번 주 $95,000 돌파할까?",
    category: "ECONOMY",
    subcategory: "crypto",
    recurrence: "weekly",
    oracleType: "coingecko",
    scheduleRule: "일요일 23:00 마감 ➔ 24:00 자동 정산",
    importance: "high",
  },
  {
    id: "kobis-weekend-boxoffice",
    title: "[주말극장] 이번 주말 박스오피스 1위 영화, 누적 관객 100만 돌파할까?",
    category: "ENTERTAINMENT",
    subcategory: "movie",
    recurrence: "weekly",
    oracleType: "kobis",
    scheduleRule: "금요일 18:00 마감 ➔ 월요일 09:00 KOBIS 정산",
    importance: "high",
  },
  {
    id: "kcontent-weekend-drama-rating",
    title: "[주말드라마] 이번 주 금토·주말 미니시리즈 최고 시청률 12% 돌파할까?",
    category: "ENTERTAINMENT",
    subcategory: "drama",
    recurrence: "weekly",
    oracleType: "kcontent",
    scheduleRule: "토요일 21:00 마감 ➔ 일요일 09:00 닐슨코리아 정산",
    importance: "high",
  },
  {
    id: "kcontent-ott-netflix-top1",
    title: "[OTT·드라마] 금주 화제작 한국 드라마, 넷플릭스 한국 TOP 10 1위 수성할까?",
    category: "ENTERTAINMENT",
    subcategory: "drama",
    recurrence: "weekly",
    oracleType: "kcontent",
    scheduleRule: "일요일 21:00 마감 ➔ 월요일 11:00 Netflix Tudum 정산",
    importance: "high",
  },
  {
    id: "kcontent-sunday-variety-king",
    title: "[예능대전] 이번 주 일요일 프라임타임 예능 시청률 1위 방송사는?",
    category: "ENTERTAINMENT",
    subcategory: "variety",
    recurrence: "weekly",
    oracleType: "kcontent",
    scheduleRule: "일요일 17:00 마감 ➔ 월요일 09:00 시청률 정산",
    importance: "medium",
  },
  {
    id: "kcontent-kpop-chart-top10",
    title: "[K-POP 차트] 이번 주 신규 발매 음원, 주간 차트 TOP 10 진입 성공할까?",
    category: "ENTERTAINMENT",
    subcategory: "music",
    recurrence: "weekly",
    oracleType: "kcontent",
    scheduleRule: "일요일 18:00 마감 ➔ 월요일 12:00 써클/멜론 정산",
    importance: "high",
  },
  {
    id: "ecos-bok-base-rate",
    title: "[금통위] 한국은행 이번 금융통화위원회 기준금리 결정은?",
    category: "ECONOMY",
    subcategory: "indicators",
    recurrence: "monthly",
    oracleType: "ecos",
    scheduleRule: "발표일 09:00 마감 ➔ 11:00 한국은행 ECOS(722Y001) 정산",
    importance: "critical",
  },
  {
    id: "ecos-bok-gdp-quarterly",
    title: "[한국은행] 이번 분기 실질 GDP 성장률(전기비) 0.5% 돌파할까?",
    category: "ECONOMY",
    subcategory: "indicators",
    recurrence: "monthly",
    oracleType: "ecos",
    scheduleRule: "발표일 07:00 마감 ➔ 09:00 한국은행 ECOS(200Y101) 정산",
    importance: "high",
  },
  {
    id: "ecos-bok-current-account",
    title: "[국제수지] 한국 이번 달 경상수지 흑자 50억 달러 상회할까?",
    category: "ECONOMY",
    subcategory: "indicators",
    recurrence: "monthly",
    oracleType: "ecos",
    scheduleRule: "발표일 07:00 마감 ➔ 09:00 한국은행 ECOS(301Y013) 정산",
    importance: "high",
  },
  {
    id: "kosis-cpi-monthly",
    title: "[통계청] 이번 달 소비자물가 상승률(전년동월비) 2.5% 상회할까?",
    category: "ECONOMY",
    subcategory: "indicators",
    recurrence: "monthly",
    oracleType: "kosis",
    scheduleRule: "발표일 07:00 마감 ➔ 09:00 통계청 KOSIS(DT_1J22003) 정산",
    importance: "high",
  },
  {
    id: "kosis-unemployment-monthly",
    title: "[고용동향] 통계청 이번 달 전국 실업률 3.0% 이하 기록할까?",
    category: "ECONOMY",
    subcategory: "indicators",
    recurrence: "monthly",
    oracleType: "kosis",
    scheduleRule: "발표일 07:00 마감 ➔ 09:00 통계청 KOSIS(DT_1DA7004S) 정산",
    importance: "high",
  },
  {
    id: "dart-samsung-quarterly",
    title: "[실적공시] 삼성전자 이번 분기 연결 영업이익 10조 원 돌파할까?",
    category: "ECONOMY",
    subcategory: "earnings",
    recurrence: "monthly",
    oracleType: "dart",
    scheduleRule: "공시 마감 1시간 전 ➔ 금감원 OpenDART 자동 정산",
    importance: "critical",
  },
  {
    id: "dart-skhynix-quarterly",
    title: "[실적공시] SK하이닉스 이번 분기 연결 영업이익 5조 원 돌파할까?",
    category: "ECONOMY",
    subcategory: "earnings",
    recurrence: "monthly",
    oracleType: "dart",
    scheduleRule: "공시 마감 1시간 전 ➔ 금감원 OpenDART 자동 정산",
    importance: "critical",
  },
  {
    id: "dart-hyundai-quarterly",
    title: "[실적공시] 현대자동차 이번 분기 연결 영업이익 3조 5,000억 원 돌파할까?",
    category: "ECONOMY",
    subcategory: "earnings",
    recurrence: "monthly",
    oracleType: "dart",
    scheduleRule: "공시 마감 1시간 전 ➔ 금감원 OpenDART 자동 정산",
    importance: "high",
  },
  {
    id: "dart-naver-quarterly",
    title: "[실적공시] NAVER 이번 분기 연결 영업이익 5,000억 원 돌파할까?",
    category: "ECONOMY",
    subcategory: "earnings",
    recurrence: "monthly",
    oracleType: "dart",
    scheduleRule: "공시 마감 1시간 전 ➔ 금감원 OpenDART 자동 정산",
    importance: "high",
  },
  {
    id: "dart-kakao-quarterly",
    title: "[실적공시] 카카오 이번 분기 연결 영업이익 1,500억 원 돌파할까?",
    category: "ECONOMY",
    subcategory: "earnings",
    recurrence: "monthly",
    oracleType: "dart",
    scheduleRule: "공시 마감 1시간 전 ➔ 금감원 OpenDART 자동 정산",
    importance: "high",
  },
];

export default function TemplatesPage() {
  const [catFilter, setCatFilter] = useState<string>("ALL");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = OFFICIAL_TEMPLATES.filter(
    (t) => catFilter === "ALL" || t.category === catFilter
  );

  const handleMaterialize = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/scheduler/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materializeTemplates: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `✅ 정기 템플릿 동기화 완료! (미발행 회차 ${data.stats?.createdGamesCount ?? 0}개 신규 발행, 이미 ACTIVE인 템플릿은 중복 방지됨)`
        );
      } else {
        setMessage(`❌ 실패: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`❌ 오류: ${e?.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-sky-400" />
            <span>정기 예측 게임 마스터 템플릿 ({OFFICIAL_TEMPLATES.length}종)</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            GameSchedulingService에 내장된 공인 데이터 오라클 기반 정기 예측 템플릿 레지스트리입니다.
          </p>
        </div>

        <AdminButton
          variant="default"
          onClick={handleMaterialize}
          disabled={syncing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "발행 점검 중..." : "미발행 회차 즉시 생성"}</span>
        </AdminButton>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-bold text-emerald-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2">
        {["ALL", "ECONOMY", "ENTERTAINMENT"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCatFilter(c)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              catFilter === c
                ? "bg-zinc-100 text-zinc-950 border-white"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            {c === "ALL" ? `전체 (${OFFICIAL_TEMPLATES.length})` : c}
          </button>
        ))}
      </div>

      {/* 템플릿 테이블 */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>표준 타임라인 & 오라클 정산 템플릿 목록</AdminCardTitle>
          <AdminCardDescription>
            동일 템플릿 ID(external_id)가 ACTIVE 상태일 경우 중복 생성을 자동으로 차단합니다.
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>템플릿 ID</AdminTableHead>
                <AdminTableHead>정기 예측 질문 타이틀</AdminTableHead>
                <AdminTableHead>도메인 / 주기</AdminTableHead>
                <AdminTableHead>오라클 어댑터</AdminTableHead>
                <AdminTableHead>마감 & 정산 타임라인 원칙</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filtered.map((tpl) => (
                <AdminTableRow key={tpl.id}>
                  <AdminTableCell className="font-mono text-xs text-zinc-400">
                    {tpl.id}
                  </AdminTableCell>
                  <AdminTableCell className="font-bold text-white max-w-md">
                    {tpl.title}
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="secondary">
                      {tpl.category} · {tpl.subcategory}
                    </AdminBadge>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase">
                      {tpl.recurrence}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="info">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{tpl.oracleType}</span>
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="text-xs text-amber-300 font-medium">
                    {tpl.scheduleRule}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
