import React from "react";
import { BatteryCharging, Zap } from "lucide-react";
import { Button } from "@/shared/ui/components/base";

interface PmpStationWidgetProps {
    currentPmp: number;
    maxPmp?: number; // Daily Cap or Level Cap
    onOpenStation: () => void;
}

export const PmpStationWidget: React.FC<PmpStationWidgetProps> = ({
    currentPmp,
    maxPmp = 1000,
    onOpenStation,
}) => {
    const percentage = Math.min(100, (currentPmp / maxPmp) * 100);
    // Color logic: Red if low, Green if high
    const fuelColor = percentage < 20 ? "bg-red-500" : "bg-green-500";

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-sm shadow-xl relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 text-yellow-400" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-800 rounded-lg">
                            <BatteryCharging className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-slate-200 font-semibold tracking-tight">PMP Station</span>
                    </div>
                    <span className="text-yellow-400 font-mono font-bold text-lg">
                        {currentPmp.toLocaleString()} <span className="text-xs text-slate-500">PMP</span>
                    </span>
                </div>

                <div className="mb-4">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ease-out ${fuelColor}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Empty</span>
                    <span>Refuel needed if low</span>
                    <span>Full</span>
                </div>

                <Button
                    onClick={onOpenStation}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-slate-900 font-bold border-none shadow-lg shadow-yellow-900/20"
                >
                    <Zap className="w-4 h-4 mr-2 fill-slate-900" />
                    무료 충전소 입장 (Ad)
                </Button>
            </div>
        </div>
    );
};
