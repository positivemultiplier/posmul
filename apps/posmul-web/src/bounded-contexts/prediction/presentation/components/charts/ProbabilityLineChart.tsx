"use client";

import { LineChart, LineConfig } from '../../../../../shared/ui/components/charts/line-chart';

interface ProbabilityLineChartProps {
    data: Array<{
        time: string;
        [key: string]: any;
    }>;
    lines?: LineConfig[];
    isDarkMode?: boolean;
}

export const ProbabilityLineChart = ({ data, lines, isDarkMode = true }: ProbabilityLineChartProps) => {
    // Default configuration if no lines provided (backward compatibility)
    const defaultLines: LineConfig[] = [
        {
            dataKey: "probability",
            name: "예측 확률",
            color: "#3B82F6", // blue-500
            strokeWidth: 3
        }
    ];

    return (
        <LineChart
            data={data}
            xAxisKey="time"
            lines={lines || defaultLines}
            height={300}
            showGrid={true}
            showTooltip={true}
            showLegend={true}
            gradientFill={true}
            isDarkMode={isDarkMode}
            className="w-full"
        />
    );
};
