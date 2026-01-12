
"use client";

import React from 'react';
import { TiltedCard } from '@/shared/ui/fancy/TiltedCard';
import { LivePriceChart } from './LivePriceChart';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PredictionStockCardProps {
    symbol: string;
    name: string;
    description: string;
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    chartData?: { time: string; price: number }[];
}

export const PredictionStockCard: React.FC<PredictionStockCardProps> = ({
    symbol,
    name,
    description,
    currentPrice,
    priceChange,
    priceChangePercent,
    chartData
}) => {
    const isUp = priceChange >= 0;

    const overlayContent = (
        <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-md">
                            {symbol}
                        </Badge>
                        {isUp ?
                            <Badge className="bg-green-500/80 text-white hover:bg-green-500">
                                <TrendingUp className="w-3 h-3 mr-1" /> +{priceChangePercent.toFixed(2)}%
                            </Badge> :
                            <Badge className="bg-red-500/80 text-white hover:bg-red-500">
                                <TrendingDown className="w-3 h-3 mr-1" /> {priceChangePercent.toFixed(2)}%
                            </Badge>
                        }
                    </div>
                    <h3 className="text-2xl font-bold text-white drop-shadow-md">{name}</h3>
                    <p className="text-sm text-slate-300 line-clamp-2 mt-1 drop-shadow-sm max-w-[80%]">
                        {description}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-white drop-shadow-lg">
                        ${currentPrice.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium ${isUp ? 'text-green-300' : 'text-red-300'} drop-shadow-sm`}>
                        {isUp ? '+' : ''}{priceChange.toFixed(2)} Today
                    </div>
                </div>
            </div>

            <div className="w-full mt-4 flex-grow flex items-end">
                {/* 
                  Chart is rendered flat, but inside a 3D tilted context. 
                  This creates a cool depth effect.
                */}
                <div className="w-full bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-2 h-[150px]">
                    <LivePriceChart symbol={symbol} data={chartData} color={isUp ? "#22c55e" : "#ef4444"} />
                </div>
            </div>

            <div className="mt-4 flex gap-2 w-full">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border-0">
                    <Activity className="w-4 h-4 mr-2" />
                    예측하기 (Predict)
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex justify-center p-4">
            <TiltedCard
                containerHeight="400px"
                containerWidth="100%"
                imageHeight="100%"
                imageWidth="100%"
                rotateAmplitude={8}
                scaleOnHover={1.02}
                displayOverlayContent={true}
                overlayContent={overlayContent}
                // Background gradient
                imageSrc="" // No image, just gradient via style override or fallback
                showTooltip={false}
            />
        </div>
    );
};
