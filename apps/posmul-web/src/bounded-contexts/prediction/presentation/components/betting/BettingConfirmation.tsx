"use client";

import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Card } from '../../../../../shared/ui/components/base';

export const BettingConfirmation = ({
  selectedOption,
  stakeAmount,
  confidence,
  expectedReturn,
  gameEndTime,
  onConfirm,
  onBack,
  isLoading = false
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const potentialProfit = expectedReturn - stakeAmount;
  const roi = ((potentialProfit / stakeAmount) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* 제목 */}
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">베팅 확인</h2>
        <p className="text-gray-600">아래 내용을 확인하고 베팅을 완료하세요</p>
      </div>

      {/* 선택한 옵션 */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedOption.color }}
          />
          <h3 className="font-semibold text-lg text-gray-900">
            {selectedOption.text}
          </h3>
          <span className="text-lg font-bold text-blue-600">
            {selectedOption.probability}%
          </span>
        </div>
        <p className="text-sm text-gray-600">
          현재 {selectedOption.participantCount?.toLocaleString() || 0}명이 참여 중
        </p>
      </Card>

      {/* 베팅 정보 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 베팅 금액 */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-700">베팅 금액</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stakeAmount)} PMP
          </div>
        </Card>

        {/* 신뢰도 */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-700">신뢰도</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {confidence}%
          </div>
        </Card>
      </div>

      {/* 수익 예측 */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">예상 수익</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">예상 총 수익</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(expectedReturn)} PMP
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">순수익</div>
            <div className="text-xl font-bold text-green-600">
              +{formatCurrency(potentialProfit)} PMP
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">수익률 (ROI)</span>
            <span className="text-lg font-bold text-green-600">+{roi}%</span>
          </div>
        </div>
      </Card>

      {/* 게임 정보 */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">게임 마감</span>
        </div>
        <div className="text-sm text-gray-600">
          {formatDate(gameEndTime)}
        </div>
      </Card>

      {/* 주의사항 */}
      <Card className="p-4 border-amber-200 bg-amber-50">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">주의사항</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 베팅 후 취소나 수정이 불가능합니다</li>
              <li>• 게임 결과에 따라 손실이 발생할 수 있습니다</li>
              <li>• 신뢰도가 높을수록 더 많은 금액이 베팅됩니다</li>
              <li>• 예상 수익은 현재 확률 기준이며 변동될 수 있습니다</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 확인 버튼들 */}
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전으로
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>처리중...</span>
            </div>
          ) : (
            '베팅 확정'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
