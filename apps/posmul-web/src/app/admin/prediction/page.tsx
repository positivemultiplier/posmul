"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Zap,
  CheckCircle2,
  Users,
  ArrowLeft,
  RefreshCw,
  Award,
} from "lucide-react";

interface PredictionGame {
  game_id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  game_options?: { options: string[] };
  min_bet_amount: number;
  max_bet_amount: number;
  created_at: string;
}

export default function AdminPredictionDashboard() {
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // 베팅 폼 상태 (gameId -> { option, amount })
  const [betState, setBetState] = useState<Record<string, { optionId: string; amount: number }>>({});
  const [betLoading, setBetLoading] = useState<string | null>(null);

  // 1. 게임 목록 불러오기
  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/pipeline");
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

  // 2. RSS Ingest & Gemini AI 초안/게임 자동 생성 실행
  const handleRunPipeline = async () => {
    setIngestLoading(true);
    setLogs(["AI Pipeline execution started..."]);
    try {
      const res = await fetch("/api/dev/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ingest-and-draft" }),
      });
      const data = await res.json();
      if (data.logs) setLogs(data.logs);

      if (data.success) {
        alert("🎉 AI 파이프라인이 성공적으로 수행되어 예측 게임이 자동 생성되었습니다!");
        fetchGames(); // 목록 새로고침
      } else {
        alert(`❌ Pipeline failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error running pipeline: ${e.message}`);
    } finally {
      setIngestLoading(false);
    }
  };

  // 3. 베팅 제출 처리
  const handleBetSubmit = async (game: PredictionGame) => {
    const targetGameId = game.game_id || game.id;
    if (!targetGameId) return;

    const options = game.game_options?.options || ["Yes", "No"];
    const currentBet = betState[targetGameId] || { optionId: options[0], amount: 1000 };
    const selectedOption = currentBet.optionId || options[0] || "Yes";
    const amount = currentBet.amount || 1000;

    setBetLoading(targetGameId);

    try {
      const res = await fetch("/api/dev/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "participate",
          gameId: targetGameId,
          optionId: selectedOption,
          amount: Number(amount),
          userId: "00000000-0000-0000-0000-000000000001",
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`🎯 베팅 성공! '${selectedOption}' 옵션에 ${amount}P 베팅이 등록되었습니다.`);
        fetchGames();
      } else {
        alert(`❌ 베팅 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error participating: ${e.message}`);
    } finally {
      setBetLoading(null);
    }
  };

  // 4. 승부 정산 제출 처리
  const handleSettleSubmit = async (game: PredictionGame, winningOption: string) => {
    const targetGameId = game.game_id || game.id;
    if (!targetGameId) return;

    if (!confirm(`'${winningOption}' 옵션을 승리로 확정하고 정산을 완료하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch("/api/dev/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settle",
          gameId: targetGameId,
          winningOption,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`🏆 정산 완료! (총 ${data.settledCount}건 정산 완료, 적중 유저 ${data.winnerCount}명)`);
        fetchGames();
      } else {
        alert(`❌ 정산 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error settling game: ${e.message}`);
    }
  };

  // 실시간 라이브 통계 수치
  const activeCount = games.filter((g) => g.status === "ACTIVE").length;
  const settledCount = games.filter((g) => g.status === "SETTLED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Top */}
        <div className="flex justify-between items-center">
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin 메인 포털로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">LIVE PREDICTION ADMIN ENGINE</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-2">
              <Target className="w-8 h-8 text-indigo-400 inline-block" />
              예측 게임 관리자 대시보드
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              AI 뉴스 피드 자동 수집 ➔ 예측 게임 생성 ➔ 베팅 모니터링 및 승부 정산(Settlement) 통합 파이프라인
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/prediction/games/create"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              + 새 게임 생성
            </Link>
            <Link
              href="/admin/prediction/settlement"
              className="px-4 py-2 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              🏆 정산 센터
            </Link>
            <button
              onClick={fetchGames}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-800 flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>
        </div>

        {/* Live DB Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">활성 예측 게임 (ACTIVE)</div>
              <div className="text-2xl font-black text-emerald-400">{activeCount}개</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">정산 완료 게임 (SETTLED)</div>
              <div className="text-2xl font-black text-amber-400">{settledCount}개</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">전체 로드된 게임 수</div>
              <div className="text-2xl font-black text-indigo-400">{games.length}개</div>
            </div>
          </div>
        </div>

        {/* Step 1: Run AI Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
                ⚡ 1단계: AI 뉴스 피드 수집 & 예측 게임 자동 생성
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                RSS 실시간 뉴스를 수집하고 Gemini AI로 분석하여 파이프라인 예측 게임을 DB에 자동 등록합니다.
              </p>
            </div>
            <button
              onClick={handleRunPipeline}
              disabled={ingestLoading}
              className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition duration-200 flex items-center gap-2 text-xs ${
                ingestLoading
                  ? "bg-indigo-800 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              }`}
            >
              {ingestLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  AI 분석 및 게임 생성 중...
                </>
              ) : (
                <>🚀 AI 파이프라인 수동 실행</>
              )}
            </button>
          </div>

          {/* Logs Window */}
          {logs.length > 0 && (
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 max-h-40 overflow-y-auto border border-slate-800/80">
              <div className="font-bold text-slate-500 mb-1 border-b border-slate-800 pb-1">AI PIPELINE LOGS</div>
              {logs.map((log, idx) => (
                <div key={idx}>[{idx + 1}] {log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Prediction Games List & Controls */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              🎮 2단계: 예측 게임 목록 & 베팅/정산 관리 콘솔 ({games.length}개)
            </h2>
          </div>

          {games.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              아직 생성된 예측 게임이 없습니다. 상단의 <b>[🚀 AI 파이프라인 수동 실행]</b> 버튼을 눌러보세요!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game, gameIdx) => {
                const targetGameId = game.game_id || game.id || `game-${gameIdx}`;
                const options = game.game_options?.options || ["Yes", "No"];
                const currentBet = betState[targetGameId] || { optionId: options[0], amount: 1000 };

                return (
                  <div
                    key={targetGameId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition duration-200 shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-lg text-xs font-semibold">
                            {game.category || "GENERAL"}
                          </span>
                          {game.status === "SETTLED" && (
                            <span className="px-2.5 py-1 bg-amber-950 text-amber-400 border border-amber-800/60 rounded-lg text-xs font-semibold flex items-center gap-1">
                              <Award className="w-3 h-3" /> 정산 완료
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(game.created_at).toLocaleString("ko-KR")}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-100 mb-2 leading-snug">{game.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 mb-4 whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        {game.description}
                      </p>
                    </div>

                    {/* Betting & Settle Controls */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                      <div className="text-xs font-semibold text-slate-300">🎯 베팅 실시간 테스트</div>

                      {/* Option Radio Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {options.map((opt, idx) => (
                          <button
                            key={`${targetGameId}-${opt}-${idx}`}
                            onClick={() =>
                              setBetState((prev) => ({
                                ...prev,
                                [targetGameId]: { ...currentBet, optionId: opt },
                              }))
                            }
                            className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                              currentBet.optionId === opt
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold shadow"
                                : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {/* Bet Amount Input & Submit */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={currentBet.amount}
                          onChange={(e) =>
                            setBetState((prev) => ({
                              ...prev,
                              [targetGameId]: { ...currentBet, amount: Number(e.target.value) },
                            }))
                          }
                          step={100}
                          min={game.min_bet_amount || 100}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                          placeholder="베팅 포인트 (P)"
                        />
                        <button
                          onClick={() => handleBetSubmit(game)}
                          disabled={betLoading === targetGameId || game.status === "SETTLED"}
                          className={`whitespace-nowrap px-4 py-2 text-white rounded-xl text-xs font-bold transition shadow-md ${
                            game.status === "SETTLED"
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                          }`}
                        >
                          {betLoading === targetGameId ? "처리 중..." : game.status === "SETTLED" ? "마감됨" : "참여하기"}
                        </button>
                      </div>

                      {/* Settle Section */}
                      <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">🏆 승부 정산:</span>
                        <div className="flex gap-1.5">
                          {options.map((opt, idx) => (
                            <button
                              key={`settle-${targetGameId}-${opt}-${idx}`}
                              onClick={() => handleSettleSubmit(game, opt)}
                              disabled={game.status === "SETTLED"}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                                game.status === "SETTLED"
                                  ? "bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed"
                                  : "bg-amber-950 hover:bg-amber-900 border-amber-800/80 text-amber-300 shadow"
                              }`}
                            >
                              [{opt}] 승리 확정
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
