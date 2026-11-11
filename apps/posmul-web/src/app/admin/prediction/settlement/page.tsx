"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Clock, RefreshCw, Trophy, Users, Coins } from "lucide-react";

interface NormalizedOption {
  id: string;
  label: string;
  odds?: number;
}

interface GameSettlementItem {
  game_id: string;
  id?: string;
  title: string;
  category: string;
  status: string;
  game_options?: any;
  options?: any;
  created_at: string;
  actual_result?: { winningOption?: string };
}

function parseGameOptions(raw: any): NormalizedOption[] {
  if (!raw) return [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }];

  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw.options && Array.isArray(raw.options)) {
    list = raw.options;
  } else {
    return [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }];
  }

  return list.map((item, idx) => {
    if (typeof item === "string") {
      return { id: item, label: item };
    }
    if (typeof item === "object" && item !== null) {
      const id = String(item.id || item.value || `opt-${idx}`);
      const label = String(item.label || item.text || item.title || item.name || id);
      const odds = typeof item.currentOdds === "number" ? item.currentOdds : undefined;
      return { id, label, odds };
    }
    return { id: String(item), label: String(item) };
  });
}

export default function PredictionSettlementDashboardPage() {
  const [games, setGames] = useState<GameSettlementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [settlingGameId, setSettlingGameId] = useState<string | null>(null);

  // 게임 목록 조회
  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prediction/pipeline");
      const data = await res.json();
      if (data.success) {
        setGames(data.games || []);
      } else {
        alert(`Failed to fetch games: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error fetching games: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // 정산 처리
  const handleSettle = async (gameId: string, winningOption: string) => {
    if (!confirm(`'${winningOption}' 옵션을 최종 승리로 확정하고 정산을 집행하시겠습니까?`)) {
      return;
    }

    setSettlingGameId(gameId);

    try {
      const res = await fetch("/api/admin/prediction/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settle",
          gameId,
          winningOption,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`🏆 정산 완료! (총 ${data.settledCount}건 베팅 정산 완료, 적중 유저 ${data.winnerCount}명)`);
        fetchGames();
      } else {
        alert(`❌ 정산 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error settling: ${e.message}`);
    } finally {
      setSettlingGameId(null);
    }
  };

  const activeGames = games.filter((g) => g.status === "ACTIVE");
  const settledGames = games.filter((g) => g.status === "SETTLED");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Top */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <Link
            href="/admin/prediction"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin/prediction 관리자로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">PREDICTION SETTLEMENT CENTER</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-400" />
              상세 승부 정산 및 배당금 집행 센터
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              마감된 예측 게임의 최종 승리 옵션을 판정하고, 적중 유저에게 배당금(PMC/PMP) 포인트를 집행합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!confirm("AI 크론 파이프라인(뉴스 수집 -> 초안 생성 -> 게임 발행 -> 자동 정산)을 실행하시겠습니까?")) return;
                setLoading(true);
                try {
                  const res = await fetch("/api/cron/prediction-pipeline");
                  const data = await res.json();
                  if (data.success) {
                    alert(`✅ AI 파이프라인 크론 실행 완료!\n${data.message}\n(자동 정산 게임: ${data.autoSettledGamesCount}건)`);
                    fetchGames();
                  } else {
                    alert(`❌ 파이프라인 실행 실패: ${data.error}`);
                  }
                } catch (e: any) {
                  alert(`오류 발생: ${e.message}`);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md border border-purple-500/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              AI 크론 파이프라인 트리거
            </button>
            <button
              onClick={fetchGames}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-800 flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              {loading ? "불러오는 중..." : "목록 새로고침"}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">정산 대기 중인 게임</div>
              <div className="text-2xl font-black text-amber-400">{activeGames.length}개</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">정산 완료된 게임</div>
              <div className="text-2xl font-black text-emerald-400">{settledGames.length}개</div>
            </div>
          </div>
        </div>

        {/* Games Settlement List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            📊 예측 게임 정산 관리 목록 ({games.length}개)
          </h2>

          <div className="space-y-4">
            {games.map((game, idx) => {
              const gId = game.game_id || game.id || `game-${idx}`;
              const options = parseGameOptions(game.game_options || game.options);
              const isSettled = game.status === "SETTLED";
              const winningOption = game.actual_result?.winningOption;

              return (
                <div
                  key={gId}
                  className={`bg-slate-900 border rounded-2xl p-6 transition shadow-lg ${
                    isSettled ? "border-slate-800 bg-slate-900/60" : "border-amber-900/40 hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-lg text-xs font-semibold">
                          {game.category || "GENERAL"}
                        </span>
                        {isSettled ? (
                          <span className="px-2.5 py-1 bg-amber-950 text-amber-400 border border-amber-800/60 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> 승부 정산 완료 (결과: '{winningOption}')
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> 진행 중 / 정산 가능
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">{game.title}</h3>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      생성일: {new Date(game.created_at).toLocaleString("ko-KR")}
                    </div>
                  </div>

                  {/* Options Settlement Execution Panel */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">정산 집행:</span> 해당 옵션을 클릭하면 즉시 승리로 확정하고 적중 유저에게 보상을 집행합니다.
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {options.map((opt, optIdx) => {
                        const isWinOpt = isSettled && (winningOption === opt.id || winningOption === opt.label);

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSettle(gId, opt.id)}
                            disabled={isSettled || settlingGameId === gId}
                            className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 shadow ${
                              isSettled
                                ? isWinOpt
                                  ? "bg-amber-500 text-slate-950 border-amber-400"
                                  : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
                                : "bg-amber-950 hover:bg-amber-900 border-amber-800 text-amber-300"
                            }`}
                          >
                            {isWinOpt ? `🏆 [승리: ${opt.label}]` : `[${opt.label}] 승리로 정산`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
