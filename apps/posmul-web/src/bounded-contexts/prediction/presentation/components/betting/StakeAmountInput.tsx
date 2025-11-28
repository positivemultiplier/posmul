"use client";

import { motion } from 'framer-motion';
import { DollarSign, Minus, Plus, Wallet } from 'lucide-react';
import { Card } from '../../../../../shared/ui/components/base';

export const StakeAmountInput = ({
  value,
  onChange,
  minAmount = 100,
  maxAmount = 100000,
  currentBalance = 50000,
  disabled = false
}) => {
  const presetAmounts = [1000, 5000, 10000, 25000, 50000];

  const handleQuickAdjust = (adjustment) => {
    const newValue = Math.max(minAmount, Math.min(maxAmount, value + adjustment));
    onChange(newValue);
  };

  const handlePresetAmount = (amount) => {
    const adjustedAmount = Math.min(amount, Math.min(maxAmount, currentBalance));
    onChange(adjustedAmount);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const isValidAmount = value >= minAmount && value <= maxAmount && value <= currentBalance;

  return (
    <div className="space-y-4">
      {/* 현재 잔고 표시 */}
      <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">현재 잔고</span>
        </div>
        <span className="text-lg font-bold text-blue-600">
          {formatCurrency(currentBalance)} PMP
        </span>
      </div>

      {/* 베팅 금액 입력 */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">베팅 금액</span>
        </div>

        {/* 입력 필드와 조정 버튼 */}
        <div className="flex items-center space-x-2 mb-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleQuickAdjust(-1000)}
            disabled={disabled || value <= minAmount}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </motion.button>

          <div className="flex-1 relative">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value) || 0)}
              disabled={disabled}
              min={minAmount}
              max={Math.min(maxAmount, currentBalance)}
              className={`
                w-full text-center text-xl font-bold py-3 px-4 border rounded-lg
                ${isValidAmount
                  ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                }
                disabled:bg-gray-100 disabled:cursor-not-allowed
              `}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              PMP
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleQuickAdjust(1000)}
            disabled={disabled || value >= Math.min(maxAmount, currentBalance)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* 범위 표시 */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>최소: {formatCurrency(minAmount)} PMP</span>
          <span>최대: {formatCurrency(Math.min(maxAmount, currentBalance))} PMP</span>
        </div>

        {/* 프리셋 금액 버튼들 */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {presetAmounts.map((amount) => {
            const isAvailable = amount <= currentBalance && amount <= maxAmount;
            return (
              <motion.button
                key={amount}
                whileHover={{ scale: isAvailable ? 1.05 : 1 }}
                whileTap={{ scale: isAvailable ? 0.95 : 1 }}
                onClick={() => isAvailable && handlePresetAmount(amount)}
                disabled={disabled || !isAvailable}
                className={`
                  px-2 py-2 rounded text-xs font-medium transition-all duration-200
                  ${value === amount && isAvailable
                    ? 'bg-blue-500 text-white'
                    : isAvailable
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {formatCurrency(amount)}
              </motion.button>
            );
          })}
        </div>

        {/* 전체 금액 베팅 버튼 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePresetAmount(currentBalance)}
          disabled={disabled || currentBalance > maxAmount}
          className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          전체 금액 베팅 ({formatCurrency(Math.min(currentBalance, maxAmount))} PMP)
        </motion.button>

        {/* 경고 메시지 */}
        {!isValidAmount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2"
          >
            {value < minAmount && `최소 베팅 금액은 ${formatCurrency(minAmount)} PMP입니다.`}
            {value > maxAmount && `최대 베팅 금액은 ${formatCurrency(maxAmount)} PMP입니다.`}
            {value > currentBalance && '잔고가 부족합니다.'}
          </motion.div>
        )}
      </Card>
    </div>
  );
};
