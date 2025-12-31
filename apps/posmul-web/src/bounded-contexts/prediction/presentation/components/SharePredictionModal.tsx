"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../shared/ui/components/base";
import { Share2, Copy, Check, Twitter, Link } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameTitle: string;
    prediction?: string; // e.g. "Man City Win"
    potentialReturn?: string; // e.g. "+140%"
}

export function SharePredictionModal({ isOpen, onClose, gameTitle, prediction, potentialReturn }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>예측 공유하기</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        당신의 예측을 공유하고 친구들의 의견을 물어보세요.
                    </DialogDescription>
                </DialogHeader>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 mb-4 text-center border border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white mb-2">{gameTitle}</h3>
                        {prediction && (
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white mb-2">
                                {prediction}
                            </div>
                        )}
                        {potentialReturn && (
                            <div className="inline-block bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm border border-white/20">
                                <span className="text-green-300 font-bold text-sm">예상 수익 {potentialReturn}</span>
                            </div>
                        )}
                        <div className="mt-6 flex justify-center items-center gap-2 text-white/50 text-xs font-mono">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            PosMul Prediction Market
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                </div>

                <div className="flex gap-2 mb-4">
                    <Button variant="outline" className="flex-1 bg-slate-800 border-white/10 hover:bg-slate-700 hover:text-white gap-2">
                        <Twitter className="w-4 h-4 text-blue-400" />
                        트위터
                    </Button>
                    <Button variant="outline" className="flex-1 bg-slate-800 border-white/10 hover:bg-slate-700 hover:text-white gap-2" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link className="w-4 h-4" />}
                        {copied ? "복사됨" : "링크 복사"}
                    </Button>
                </div>

                <DialogFooter className="sm:justify-center">
                    <p className="text-xs text-slate-500 text-center">
                        공유된 링크를 통해 친구가 가입하면 보너스 PMP를 받을 수 있습니다.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
