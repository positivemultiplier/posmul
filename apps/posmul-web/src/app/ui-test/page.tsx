
"use client";

import { PredictionStockCard } from "@/bounded-contexts/prediction/presentation/components/PredictionStockCard";

export default function UiTestPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-10 font-sans">
            <h1 className="text-4xl font-bold text-white mb-10 text-center">
                PosMul Premium UI Showcase
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* 1. Nasdaq 100 Card */}
                <PredictionStockCard
                    symbol="QQQ"
                    name="Nasdaq 100 ETF"
                    description="Invesco QQQ Trust. Tracks the Nasdaq-100 index."
                    currentPrice={485.32}
                    priceChange={2.45}
                    priceChangePercent={0.51}
                    chartData={[
                        { time: '09:30', price: 483.0 },
                        { time: '11:00', price: 484.2 },
                        { time: '13:00', price: 483.8 },
                        { time: '15:00', price: 485.1 },
                        { time: '16:00', price: 485.32 },
                    ]}
                />

                {/* 2. NVIDIA Card */}
                <PredictionStockCard
                    symbol="NVDA"
                    name="NVIDIA Corp."
                    description="AI computing leader. The most valuable company."
                    currentPrice={138.20}
                    priceChange={-1.50}
                    priceChangePercent={-1.07}
                    chartData={[
                        { time: '09:30', price: 140.0 },
                        { time: '11:00', price: 139.5 },
                        { time: '13:00', price: 138.8 },
                        { time: '15:00', price: 137.9 },
                        { time: '16:00', price: 138.2 },
                    ]}
                />

                {/* 3. Tesla Card */}
                <PredictionStockCard
                    symbol="TSLA"
                    name="Tesla Inc."
                    description="Electric vehicle and clean energy company."
                    currentPrice={245.80}
                    priceChange={5.20}
                    priceChangePercent={2.16}
                    chartData={[
                        { time: '09:30', price: 239.0 },
                        { time: '11:00', price: 241.5 },
                        { time: '13:00', price: 243.8 },
                        { time: '15:00', price: 245.1 },
                        { time: '16:00', price: 245.8 },
                    ]}
                />
            </div>

            <div className="mt-20 text-center text-slate-500">
                <p>Scroll or Hover over cards to see 3D effect.</p>
                <p className="text-sm mt-2">Powered by React Bits x Recharts</p>
            </div>
        </div>
    );
}
