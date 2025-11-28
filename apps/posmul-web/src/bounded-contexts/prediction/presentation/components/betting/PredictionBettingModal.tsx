"use client";

import { X } from 'lucide-react';
import { PredictionOptionCard } from './PredictionOptionCard';
import { StakeAmountInput } from './StakeAmountInput';
import { ConfidenceSlider } from './ConfidenceSlider';
import { BettingConfirmation } from './BettingConfirmation';
import { useBettingModal } from '../../hooks/useBettingModal';

export const PredictionBettingModal = ({
  isOpen,
  onClose,
  gameData,
  onSubmitBet
}) => {
  const {
    step,
    selectedOption,
    stakeAmount,
    confidence,
    isSubmitting,
    nextStep,
    prevStep,
    selectOption,
    updateStakeAmount,
    updateConfidence,
    submitBet,
    canProceedToNext,
    expectedReturn,
    selectedOptionData
  } = useBettingModal(gameData);

  if (!isOpen) return null;

  // Mock game data - 실제 구현에서는 props로 받은 gameData 사용
  const mockGameData = gameData || {
    id: 'game-1',
    title: "2024 대선 결과 예측",
    options: [
      {
        id: 1,
        text: "민주당 승리",
        probability: 52,
        color: "#3b82f6",
        totalBets: 1250000,
        participantCount: 245,
        trend: 'up'
      },
      {
        id: 2,
        text: "공화당 승리",
        probability: 48,
        color: "#ef4444",
        totalBets: 980000,
        participantCount: 198,
        trend: 'down'
      }
    ],
    endTime: "2024-11-05T08:00:00Z",
    totalPool: 2230000
  };

  const handleSubmit = () => {
    submitBet(onSubmitBet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{mockGameData.title}</h2>
            <p className="text-sm text-gray-600 mt-1">예측에 참여하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }`}>
                  {stepNum}
                </div>
                <span className={`ml-2 text-sm ${step >= stepNum ? 'text-blue-600' : 'text-gray-500'}`}>
                  {stepNum === 1 && '옵션 선택'}
                  {stepNum === 2 && '베팅 설정'}
                  {stepNum === 3 && '확인'}
                </span>
                {stepNum < 3 && <div className="ml-4 w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Step 1: 옵션 선택 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">어떤 결과를 예측하시나요?</h3>
              <div className="space-y-3">
                {mockGameData.options.map((option) => (
                  <PredictionOptionCard
                    key={option.id}
                    option={option}
                    isSelected={selectedOption === option.id}
                    onClick={selectOption}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 베팅 설정 */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">베팅 금액과 신뢰도를 설정하세요</h3>

              {/* 선택된 옵션 요약 */}
              {selectedOptionData && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedOptionData.color }}
                    />
                    <span className="font-semibold">{selectedOptionData.text}</span>
                    <span className="text-blue-600 font-bold">{selectedOptionData.probability}%</span>
                  </div>
                </div>
              )}

              <StakeAmountInput
                value={stakeAmount}
                onChange={updateStakeAmount}
                currentBalance={50000}
                minAmount={1000}
                maxAmount={100000}
              />

              <ConfidenceSlider
                value={confidence}
                onChange={updateConfidence}
              />
            </div>
          )}

          {/* Step 3: 확인 */}
          {step === 3 && selectedOptionData && (
            <BettingConfirmation
              selectedOption={selectedOptionData}
              stakeAmount={stakeAmount}
              confidence={confidence}
              expectedReturn={expectedReturn}
              gameEndTime={mockGameData.endTime}
              onConfirm={handleSubmit}
              onBack={prevStep}
              isLoading={isSubmitting}
            />
          )}
        </div>

        {/* Footer - 1, 2단계에서만 표시 */}
        {step < 3 && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={step === 1 ? onClose : prevStep}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {step === 1 ? '취소' : '이전'}
            </button>

            <button
              onClick={nextStep}
              disabled={!canProceedToNext}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 1 ? '다음' : '확인'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
