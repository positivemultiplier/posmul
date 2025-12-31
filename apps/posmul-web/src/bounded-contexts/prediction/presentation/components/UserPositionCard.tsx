"use client";

import { Card } from "../../../../shared/ui/components/base";
import { Wallet, TrendingUp, Plus, ArrowRightLeft } from "lucide-react";
import { Button } from "../../../../shared/ui/components/base";

interface UserPositionCardProps {
    userBets: Array<{
        betId: string;
        selectedOption: string;
        betAmount: number;
        status: string;
        createdAt: string;
    }>;
    gameOptions: Array<{
        id: string;
        label: string;
        odds: number;
    }>;
    onAddBetAction: (optionId: string) => void;
}

export function UserPositionCard({ userBets, gameOptions, onAddBetAction }: UserPositionCardProps) {
    if (!userBets || userBets.length === 0) return null;

    // Aggregate bets by option
    const positionSummary = userBets.reduce((acc, bet) => {
        const option = gameOptions.find(opt => opt.id === bet.selectedOption);
        if (!option) return acc;

        if (!acc[bet.selectedOption]) {
            acc[bet.selectedOption] = {
                optionLabel: option.label,
                totalStake: 0,
                currentOdds: option.odds,
                count: 0
            };
        }
        acc[bet.selectedOption].totalStake += bet.betAmount;
        acc[bet.selectedOption].count += 1;
        return acc;
    }, {} as Record<string, { optionLabel: string; totalStake: number; currentOdds: number; count: number }>);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-slate-200">내 포지션 (My Positions)</span>
            </div>

            {Object.entries(positionSummary).map(([optionId, summary]) => {
                const expectedReturn = summary.totalStake * summary.currentOdds;
                const roi = ((expectedReturn - summary.totalStake) / summary.totalStake) * 100;

                return (
                    <Card key={optionId} className="bg-slate-900 border-blue-500/30 p-5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-sm text-slate-400 mb-1">예측 선택</div>
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                    {summary.optionLabel}
                                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                                        {summary.currentOdds.toFixed(2)}x
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400 mb-1">총 투자금</div>
                                <div className="text-lg font-bold text-white">{summary.totalStake.toLocaleString()} PMP</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-3 border-t border-white/5 bg-slate-950/30 -mx-5 px-5 mb-4">
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-0.5">예상 수익금</div>
                                <div className="text-sm font-bold text-green-400">
                                    {expectedReturn.toLocaleString()} PMP
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-0.5">예상 수익률 (ROI)</div>
                                <div className="text-sm font-bold text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{roi.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => onAddBetAction(optionId)}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-none h-10"
                            >
                                <Plus className="w-4 h-4 mr-1.5" /> 추가 베팅
                            </Button>
                            <Button
                                variant="outline"
                                disabled
                                className="flex-1 border-white/10 text-slate-500 hover:bg-slate-800 hover:text-slate-400 h-10 opacity-70 cursor-not-allowed"
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-1.5" /> 중도 회수 (Soon)
                            </Button>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
