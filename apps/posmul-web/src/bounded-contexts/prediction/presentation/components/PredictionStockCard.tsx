
"use client";

import React from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { TiltedCard } from "@/shared/ui/fancy/TiltedCard";
import { PredictionTrendChart, TrendPoint } from "./PredictionTrendChart";
import { PredictionType } from "../../domain/value-objects/prediction-types";

interface PredictionStockCardProps {
    symbol: string;
    name: string;
    description: string;
    currentParticipants: number;
    totalStake: number;
    trendData: TrendPoint[];
    predictionType: PredictionType;
    onPredict?: () => void;
}

export const PredictionStockCard: React.FC<PredictionStockCardProps> = ({
    symbol,
    name,
    description,
    currentParticipants,
    totalStake,
    trendData,
    predictionType,
    onPredict,
}) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(val);

    const overlayContent = (
        <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant="outline" className="mb-2 bg-white/10 text-white border-white/20 backdrop-blur-md">
                        {symbol}
                    </Badge>
                    <h3 className="text-xl font-bold text-white leading-none">{name}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 pr-4">{description}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{formatCurrency(totalStake)}</div>
                    <div className="text-xs text-emerald-400 font-medium">Active Stake</div>
                </div>
            </div>

            <div className="w-full mt-4 flex-grow flex items-end">
                <div className="w-full bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-2 h-[150px]">
                    <PredictionTrendChart
                        data={trendData}
                        type={predictionType}
                        height={130}
                    />
                    <div className="flex justify-between items-center px-1 mt-1">
                        <span className="text-[10px] text-slate-400">참여자 {currentParticipants}명</span>
                        <span className="text-[10px] text-slate-400">실시간 순위/트렌드</span>
                    </div>
                </div>
            </div>

            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    onPredict?.();
                }}
                className="w-full mt-4 bg-white text-black hover:bg-slate-200 font-semibold"
            >
                예측 참여하기
            </Button>
        </div>
    );

    return (
        <div className="flex justify-center p-4">
            <TiltedCard
                imageSrc="/images/prediction-card-pattern.png"
                altText={`${name} Prediction Card`}
                captionText={description}
                containerHeight="320px"
                containerWidth="100%"
                imageHeight="320px"
                imageWidth="100%"
                rotateAmplitude={8}
                scaleOnHover={1.02}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent={true}
                overlayContent={overlayContent}
            />
        </div>
    );
};
