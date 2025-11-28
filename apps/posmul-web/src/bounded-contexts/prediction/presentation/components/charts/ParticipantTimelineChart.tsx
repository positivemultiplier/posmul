"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ParticipantTimelineChart = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value, name) => {
              if (name === 'count') {
                return [`${value}명`, '총 참여자'];
              }
              if (name === 'newParticipants') {
                return [`${value}명`, '신규 참여자'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `시간: ${label}`}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            name="count"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="newParticipants"
            fill="#10b981"
            name="newParticipants"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex justify-center space-x-6 mt-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">총 참여자</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">신규 참여자</span>
        </div>
      </div>
    </div>
  );
};
