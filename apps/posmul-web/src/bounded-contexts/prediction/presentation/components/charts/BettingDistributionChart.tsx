"use client";

import React from 'react';
import { DonutChart } from '../../../../../shared/ui/components/charts/pie-chart';

interface BettingDistributionChartProps {
  data: Array<{
    option: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  isDarkMode?: boolean;
}

export const BettingDistributionChart = ({ data, isDarkMode = true }: BettingDistributionChartProps) => {
  const chartData = data.map(item => ({
    name: item.option,
    value: item.amount,
    color: item.color
  }));

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <DonutChart
      data={chartData}
      height={170}
      innerRadius={45}
      outerRadius={70}
      centerText={`${(totalAmount / 10000).toFixed(1)}만`}
      centerSubText="총 베팅액"
      showTooltip={true}
      showLegend={false}
      isDarkMode={isDarkMode}
      animate={true}
    />
  );
};
