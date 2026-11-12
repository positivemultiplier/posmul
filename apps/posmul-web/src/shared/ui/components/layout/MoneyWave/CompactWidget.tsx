"use client";

import { useState } from "react";
import { Zap, X, Users, TrendingUp } from "lucide-react";
import { SlotMachine } from "./SlotMachine";
import { useWaveCalculation } from "./useWaveCalculation";

interface CompactWidgetProps {
    domain?: string;
    category?: string;
}

export function CompactWidget({ domain = 'prediction', category = 'all' }: CompactWidgetProps) {
    const [showModal, setShowModal] = useState(false);
    const { waveAmount, isSpinning, progressRatio, participantCount, activeGames } = useWaveCalculation({ domain, category });

    return (
        <>
            {/* Compact Button */}
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-lg border border-green-500/30 transition-all duration-200 group"
            >
                <Zap className="w-4 h-4 text-green-400 animate-pulse" />
                <div className="text-left">
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Wave</span>
                        <span className="text-sm font-bold text-green-400">
                            {waveAmount.toLocaleString()}
                        </span>
                    </div>
                </div>
                <TrendingUp className="w-3 h-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-[#1a1a2e] rounded-2xl border border-white/10 max-w-2xl w-full p-8 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Money Wave</h2>
                                    <p className="text-sm text-gray-400">세후 순이익(EAT) 기반 시간당 분배</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Wave Display */}
                        <div className="mb-6 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl text-center">
                            <p className="text-sm text-gray-400 mb-2">현재 Wave 금액</p>
                            <div className="text-5xl">
                                <SlotMachine
                                    value={waveAmount}
                                    isSpinning={isSpinning}
                                    progressRatio={progressRatio}
                                    showMeta
                                    className="text-green-400"
                                />
                            </div>
                            <p className="text-sm text-gray-400 mt-2">PMC</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm text-gray-400">참여자</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-400">
                                    {participantCount.toLocaleString()} <span className="text-sm">명</span>
                                </p>
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm text-gray-400">활성 게임</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-400">
                                    {activeGames.toLocaleString()} <span className="text-sm">개</span>
                                </p>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 mb-6">
                            <h3 className="font-bold mb-3">💡 Money Wave 작동 원리</h3>
                            <div className="space-y-2 text-sm text-gray-300">
                                <p>• 세후 순이익(EAT) 기준 연간 재원을 365일로 나눔</p>
                                <p>• 24시간으로 나눔 → <span className="text-green-400 font-semibold">1시간마다 Wave 발생</span></p>
                                <p>• 각 예측 카드의 가중치에 따라 분배됨</p>
                                <p>• 현재 카테고리: <span className="text-blue-400 font-semibold">{category === 'all' ? '전체' : category}</span></p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
