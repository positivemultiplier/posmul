"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ParticipantTimelineChartProps {
  data: any[];
  isDarkMode?: boolean;
}

export const ParticipantTimelineChart = ({ data, isDarkMode = false }: ParticipantTimelineChartProps) => {
  const gridColor = isDarkMode ? "#334155" : "#e5e7eb"; // slate-700 : gray-200
  const axisColor = isDarkMode ? "#94a3b8" : "#6b7280"; // slate-400 : gray-500
  const tooltipBg = isDarkMode ? "#1e293b" : "#fff"; // slate-800 : white
  const tooltipBorder = isDarkMode ? "#334155" : "#e5e7eb"; // slate-700 : gray-200
  const tooltipText = isDarkMode ? "#f8fafc" : "#111827"; // slate-50 : gray-900

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="time"
            stroke={axisColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={axisColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              color: tooltipText
            }}
            cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            formatter={(value, name) => {
              if (name === 'count') {
                return [`${value}명`, '총 참여자'];
              }
              if (name === 'newParticipants') {
                return [`${value}명`, '신규 참여자'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `⏰ ${label}`}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            name="count"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="newParticipants"
            fill="#10b981"
            name="newParticipants"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex justify-center space-x-6 mt-4 text-sm font-medium">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>총 참여자</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>신규 참여자</span>
        </div>
      </div>
    </div>
  );
};
