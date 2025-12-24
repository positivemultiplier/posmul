"use client";

import { useMemo, useState } from "react";

import { BarChart2, Info, Trophy } from "lucide-react";

import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { PredictionDetailView } from "../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";
import { PredictionChartView } from "../../../bounded-contexts/prediction/presentation/components/charts/PredictionChartView";

type TabType = "prediction" | "charts" | "info";

type MoneyWaveCategory = "sports" | "politics" | "entertainment" | "economy" | "all";

type PredictionOption = {
  id: string;
  label: string;
  probability: number;
  odds: number;
  volume: number;
  change24h: number;
};

type PredictionGameDetail = {
  id: string;
  title: string;
  description: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: PredictionOption[];
  totalVolume: number;
  participantCount: number;
  endTime: string;
  settlementTime: string;
  status: "ACTIVE" | "ENDED" | "SETTLED";
  category: string;
  creator: {
    name: string;
    reputation: number;
    avatar: string;
  };
  prizePool: number;
  minimumStake: number;
  maximumStake: number;
};

type Props = {
  game: PredictionGameDetail;
  userBalance: { pmp: number; pmc: number };
  moneyWave: {
    category: MoneyWaveCategory;
    subcategory: string;
    league: string;
  };
};

export function PredictionDetailTabsClient({ game, userBalance, moneyWave }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("prediction");

  const gameWithDates = useMemo(() => {
    return {
      ...game,
      endTime: new Date(game.endTime),
      settlementTime: new Date(game.settlementTime),
    };
  }, [game]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold">{game.title}</h1>
          {game.description ? (
            <p className="mt-2 text-slate-300">{game.description}</p>
          ) : null}
        </div>

        <div className="mb-8">
          <CompactMoneyWaveCard
            depthLevel={5}
            category={moneyWave.category}
            subcategory={moneyWave.subcategory}
            league={moneyWave.league}
            gameId={game.id}
            initialPool={game.prizePool}
          />
        </div>

        <div className="mb-6 flex items-center p-1.5 bg-slate-900/80 rounded-xl border border-white/10 w-full sm:w-fit">
          {([
            { id: "prediction", label: "예측하기", icon: Trophy },
            { id: "charts", label: "차트분석", icon: BarChart2 },
            { id: "info", label: "정보", icon: Info },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all " +
                (activeTab === tab.id
                  ? "bg-white text-slate-900"
                  : "text-slate-300 hover:text-white hover:bg-white/5")
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[320px]">
          {activeTab === "prediction" ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6">
              <PredictionDetailView game={gameWithDates} userBalance={userBalance} />
            </div>
          ) : null}

          {activeTab === "charts" ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6">
              <PredictionChartView
                gameId={game.id}
                predictionType={game.predictionType === "binary" ? "BINARY" : "MULTIPLE_CHOICE"}
              />
            </div>
          ) : null}

          {activeTab === "info" ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-slate-300">참여 마감</div>
                  <div className="mt-1 font-semibold">
                    {new Date(game.endTime).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-slate-300">정산</div>
                  <div className="mt-1 font-semibold">
                    {new Date(game.settlementTime).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-slate-300">최소 베팅</div>
                  <div className="mt-1 font-semibold">
                    {game.minimumStake.toLocaleString()} PMP
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-slate-300">최대 베팅</div>
                  <div className="mt-1 font-semibold">
                    {game.maximumStake.toLocaleString()} PMP
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
