
"use client";

import { PredictionStockCard } from "@/bounded-contexts/prediction/presentation/components/PredictionStockCard";
import { PredictionType } from "@/bounded-contexts/prediction/domain/value-objects/prediction-types";

// Mock Data Generators
const generateTrendData = (type: PredictionType) => {
    const points = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString();
        let snapshotData = {};

        if (type === PredictionType.BINARY) {
            const seed = Math.sin(i / 5) * 20 + 50;
            snapshotData = {
                "상승": Math.min(100, Math.max(0, seed + Math.random() * 10)),
                "하락": Math.min(100, Math.max(0, 100 - (seed + Math.random() * 10)))
            };
        } else if (type === PredictionType.RANKING) {
            snapshotData = {
                "OpA": 20 + Math.random() * 10,
                "OpB": 30 + Math.sin(i / 3) * 20,
                "OpC": 10 + Math.cos(i / 4) * 5,
                "OpD": 40 - Math.sin(i / 3) * 10
            };
        }
        points.push({ timestamp: time, snapshot_data: snapshotData });
    }
    return points;
};

export default function UiTestPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-10 font-sans">
            <h1 className="text-4xl font-bold text-white mb-10 text-center">
                PosMul Prediction Trend Showcase
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* 1. QQQ (Binary) */}
                <PredictionStockCard
                    symbol="QQQ"
                    name="Nasdaq 100 Forecast"
                    description="Will QQQ close higher today? Crowd sentiment is shifting."
                    currentParticipants={1240}
                    totalStake={5000000}
                    predictionType={PredictionType.BINARY}
                    trendData={generateTrendData(PredictionType.BINARY)}
                />

                {/* 2. Top Sector (Ranking) */}
                <PredictionStockCard
                    symbol="SECTOR"
                    name="Top Performers"
                    description="Which sector will lead the market next week?"
                    currentParticipants={850}
                    totalStake={3200000}
                    predictionType={PredictionType.RANKING}
                    trendData={generateTrendData(PredictionType.RANKING)}
                />

                {/* 3. TSLA (Binary) */}
                <PredictionStockCard
                    symbol="TSLA"
                    name="Tesla Q4 Earnings"
                    description="Beat or Miss? Community predictions are volatile."
                    currentParticipants={3200}
                    totalStake={12500000}
                    predictionType={PredictionType.BINARY}
                    trendData={generateTrendData(PredictionType.BINARY)}
                />
            </div>

            <div className="mt-20 text-center text-slate-500">
                <p>Scroll or Hover over cards to see 3D effect.</p>
                <p className="text-sm mt-2">Powered by PredictionTrends (Internal Data)</p>
            </div>
        </div>
    );
}
