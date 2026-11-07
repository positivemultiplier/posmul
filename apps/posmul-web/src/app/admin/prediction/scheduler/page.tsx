"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
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

interface OracleStatusPayload {
  verifiedAt: string;
  liveMarketSnapshot: {
    btcUsd: number;
    btcKrw: number;
    btcChange24h: number;
    ethUsd: number;
    usdKrw: number;
  };
  oracleAdapters: Array<{
    sourceType: string;
    name: string;
    category: string;
    configured: boolean;
    status: string;
  }>;
  summary: {
    activeGamesCount: number;
    registeredSettlementSourcesCount: number;
  };
  registeredSettlementSources: Array<{
    id: string;
    game_id: string;
    source_type: string;
    external_id: string | null;
    scheduled_at: string;
  }>;
}

export default function SchedulerPage() {
  const [oracleData, setOracleData] = useState<OracleStatusPayload | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadOracleAndScheduler = async () => {
    try {
      const res = await fetch("/api/prediction/oracle-status");
      const data = await res.json();
      if (data.success) {
        setOracleData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOracleAndScheduler();
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/scheduler/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materializeTemplates: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(
          `✅ 마스터 스케줄러 동기화 완료! (템플릿 ${data.stats?.templateGames ?? 0}개 스캔, 신규 생성 ${data.stats?.createdGamesCount ?? 0}개)`
        );
        loadOracleAndScheduler();
      } else {
        setSyncMessage(`❌ 동기화 실패: ${data.error}`);
      }
    } catch (e: any) {
      setSyncMessage(`❌ 동기화 오류: ${e?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-sky-400" />
            <span>마스터 스케줄러 & 9대 오라클 동기화 센터</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            정기 예측 템플릿 자동 발행 및 9대 공인 데이터 오라클(KOBIS, 닐슨/K-Content, CoinGecko, DART, KOSIS, ECOS 등) 실시간 상태를 관리합니다.
          </p>
        </div>

        <AdminButton
          variant="default"
          onClick={handleTriggerSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "동기화 실행 중..." : "지금 마스터 동기화 실행"}</span>
        </AdminButton>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/40 text-xs font-bold text-sky-200">
          {syncMessage}
        </div>
      )}

      {/* 실시간 글로벌 시세 스냅샷 */}
      {oracleData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminCard>
            <AdminCardHeader className="pb-2">
              <AdminCardTitle className="text-xs text-zinc-400">
                실시간 Bitcoin (CoinGecko)
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-black text-amber-300 font-mono">
                ${oracleData.liveMarketSnapshot.btcUsd.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                ₩{oracleData.liveMarketSnapshot.btcKrw.toLocaleString()}
              </div>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader className="pb-2">
              <AdminCardTitle className="text-xs text-zinc-400">
                실시간 USD/KRW 환율
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-black text-sky-300 font-mono">
                ₩{oracleData.liveMarketSnapshot.usdKrw.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                ExchangeRate Open API 연동
              </div>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader className="pb-2">
              <AdminCardTitle className="text-xs text-zinc-400">
                연결된 공인 오라클 어댑터
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-black text-emerald-400">
                {oracleData.oracleAdapters.length}개 가동 중
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                SettlementOrchestrator 통합
              </div>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader className="pb-2">
              <AdminCardTitle className="text-xs text-zinc-400">
                자동 정산 예약 대기열
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-black text-white">
                {oracleData.summary.registeredSettlementSourcesCount}건
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                활성 예측 게임 {oracleData.summary.activeGamesCount}개 중
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>
      )}

      {/* 9대 공인 데이터 오라클 어댑터 테이블 */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>9대 공인 데이터 오라클 어댑터 명세</span>
          </AdminCardTitle>
          <AdminCardDescription>
            SettlementOrchestratorService에 등록된 외부 검증 데이터 파이프라인 목록
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>오라클 코드</AdminTableHead>
                <AdminTableHead>공인 기관 / 데이터 소스명</AdminTableHead>
                <AdminTableHead>적용 도메인</AdminTableHead>
                <AdminTableHead className="text-right">상태</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {(oracleData?.oracleAdapters || []).map((ad) => (
                <AdminTableRow key={ad.sourceType}>
                  <AdminTableCell className="font-mono font-bold text-sky-300">
                    {ad.sourceType}
                  </AdminTableCell>
                  <AdminTableCell className="font-bold text-white">
                    {ad.name}
                  </AdminTableCell>
                  <AdminTableCell className="text-zinc-400">
                    {ad.category}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <AdminBadge variant="success">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{ad.status}</span>
                    </AdminBadge>
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
