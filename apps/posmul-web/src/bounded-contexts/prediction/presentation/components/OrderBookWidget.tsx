"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "../../../../shared/ui/components/base";

type Order = {
    price: number;
    amount: number;
    total: number;
};

interface OrderBookProps {
    currentPrice: number; // 0.0 to 1.0 (probability)
    volume: number;
}

export function OrderBookWidget({ currentPrice, volume }: OrderBookProps) {
    // Simulate order book data based on current price
    const [orderData, setOrderData] = useState<{ asks: Order[]; bids: Order[] }>({ asks: [], bids: [] });

    useEffect(() => {
        const generateOrders = (startPrice: number, isAsk: boolean): Order[] => {
            let currentP = startPrice;
            let currentTotal = 0;
            return Array.from({ length: 7 }).map((_, i) => {
                const step = 0.01 + Math.random() * 0.02;
                currentP = isAsk ? currentP + step : currentP - step;
                const amount = Math.floor(1000 + Math.random() * 5000);
                currentTotal += amount;
                return {
                    price: Math.max(0.01, Math.min(0.99, currentP)),
                    amount,
                    total: currentTotal,
                };
            });
        };

        const asks = generateOrders(currentPrice, true).reverse();
        const bids = generateOrders(currentPrice, false);

        setOrderData({ asks, bids });
    }, [currentPrice]);

    const { asks, bids } = orderData;

    const maxTotal = Math.max(
        asks[0]?.total || 0,
        bids[bids.length - 1]?.total || 0
    );

    return (
        <Card className="bg-slate-900 border-white/5 p-4 text-xs font-mono">
            <div className="flex justify-between text-slate-500 mb-2 px-1">
                <span>Price</span>
                <span>Amount (PMP)</span>
                <span>Total</span>
            </div>

            {/* Asks (Sell Orders) - Red */}
            <div className="space-y-0.5 mb-2">
                {asks.map((order, i) => (
                    <div key={`ask-${i}`} className="relative flex justify-between py-0.5 px-1 hover:bg-white/5">
                        <div
                            className="absolute top-0 right-0 bottom-0 bg-red-500/10"
                            style={{ width: `${(order.total / maxTotal) * 100}%` }}
                        />
                        <span className="text-red-400 relative z-10">{order.price.toFixed(2)}</span>
                        <span className="text-slate-300 relative z-10">{order.amount.toLocaleString()}</span>
                        <span className="text-slate-500 relative z-10">{order.total.toLocaleString()}</span>
                    </div>
                ))}
            </div>

            {/* Current Price spread */}
            <div className="py-2 text-center border-y border-white/10 my-2 text-lg font-bold text-white flex justify-center items-center gap-2">
                <span>{currentPrice.toFixed(2)}</span>
                <span className="text-xs font-normal text-slate-500">Spread: 0.02</span>
            </div>

            {/* Bids (Buy Orders) - Green */}
            <div className="space-y-0.5">
                {bids.map((order, i) => (
                    <div key={`bid-${i}`} className="relative flex justify-between py-0.5 px-1 hover:bg-white/5">
                        <div
                            className="absolute top-0 right-0 bottom-0 bg-green-500/10"
                            style={{ width: `${(order.total / maxTotal) * 100}%` }}
                        />
                        <span className="text-green-400 relative z-10">{order.price.toFixed(2)}</span>
                        <span className="text-slate-300 relative z-10">{order.amount.toLocaleString()}</span>
                        <span className="text-slate-500 relative z-10">{order.total.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
