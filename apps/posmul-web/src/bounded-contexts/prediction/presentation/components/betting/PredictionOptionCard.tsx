"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card } from '../../../../../shared/ui/components/base';

export const PredictionOptionCard = ({
  option,
  isSelected,
  onClick,
  disabled = false
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-400" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      animate={{ scale: isSelected ? 1.02 : 1 }}
      className={`cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={() => !disabled && onClick(option.id)}
    >
      <Card
        className={`
          p-4 border-2 transition-all duration-300
          ${isSelected
            ? `border-2 shadow-lg ring-2 ring-opacity-50`
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
        style={{
          borderColor: isSelected ? option.color : undefined,
          backgroundColor: isSelected ? `${option.color}08` : undefined,
        }}
      >
        {/* 옵션 제목과 확률 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{option.text}</h3>
          <div className="flex items-center space-x-1">
            {option.trend && getTrendIcon(option.trend)}
            <span
              className="text-xl font-bold"
              style={{ color: option.color }}
            >
              {option.probability}%
            </span>
          </div>
        </div>

        {/* 확률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: option.color }}
            initial={{ width: 0 }}
            animate={{ width: `${option.probability}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* 베팅 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <div>
              <span className="text-xs text-gray-500 block">총 베팅액</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(option.totalBets)}
              </span>
            </div>
          </div>
          {option.participantCount && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <div>
                <span className="text-xs text-gray-500 block">참여자</span>
                <span className="font-medium text-gray-900">
                  {option.participantCount.toLocaleString()}명
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 예상 수익률 (선택된 경우만) */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-2 bg-white rounded border border-gray-100"
          >
            <div className="text-xs text-gray-500 mb-1">예상 수익률</div>
            <div className="text-sm font-semibold text-green-600">
              +{((100 / option.probability - 1) * 100).toFixed(1)}%
            </div>
          </motion.div>
        )}

        {/* 선택 체크 표시 */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: option.color }}
          >
            <span className="text-white text-xs font-bold">✓</span>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
