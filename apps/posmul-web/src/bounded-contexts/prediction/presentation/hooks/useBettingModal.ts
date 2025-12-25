"use client";

import { useCallback, useState } from "react";

export type BettingTrend = "up" | "down" | "stable";

export interface BettingOption {
  readonly id: string;
  readonly text: string;
  readonly probability: number;
  readonly totalBets?: number;
  readonly participantCount?: number;
  readonly trend?: BettingTrend;
  readonly color?: string;
}

export interface BettingGameData {
  readonly id: string;
  readonly title: string;
  readonly options: BettingOption[];
  readonly endTime?: string;
  readonly totalPool?: number;
}

export interface SubmitBetData {
  readonly gameId: string;
  readonly optionId: string;
  readonly stakeAmount: number;
  readonly confidence: number;
  readonly expectedReturn: number;
}

export type SubmitBetHandler = (bet: SubmitBetData) => Promise<void> | void;

export const useBettingModal = (initialGameData: BettingGameData | null = null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [gameData, setGameData] = useState<BettingGameData | null>(initialGameData);
  const [step, setStep] = useState(1); // 1: 옵션 선택, 2: 베팅 설정, 3: 확인
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState(1000);
  const [confidence, setConfidence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = useCallback((game: BettingGameData) => {
    setGameData(game);
    setIsOpen(true);
    setStep(1);
    setSelectedOption(null);
    setStakeAmount(1000);
    setConfidence(50);
    setIsSubmitting(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setStep(1);
    setSelectedOption(null);
    setStakeAmount(1000);
    setConfidence(50);
    setIsSubmitting(false);
  }, []);

  const nextStep = useCallback(() => {
    if (step < 3) {
      setStep(step + 1);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 1 && targetStep <= 3) {
      setStep(targetStep);
    }
  }, []);

  const selectOption = useCallback((optionId: string) => {
    setSelectedOption(optionId);
  }, []);

  const updateStakeAmount = useCallback((amount: number) => {
    setStakeAmount(amount);
  }, []);

  const updateConfidence = useCallback((confidenceLevel: number) => {
    setConfidence(confidenceLevel);
  }, []);

  const calculateExpectedReturn = useCallback(() => {
    if (!gameData || !selectedOption) return 0;

    const option = gameData.options.find((opt) => opt.id === selectedOption);
    if (!option) return 0;
    if (option.probability <= 0) return 0;

    // 기본 수익률 계산: (100 / 확률) - 1
    const baseMultiplier = 100 / option.probability;

    // 신뢰도에 따른 조정 (신뢰도가 높을수록 더 많이 베팅)
    const confidenceMultiplier = confidence / 100;
    const adjustedStake = stakeAmount * confidenceMultiplier;

    return adjustedStake * baseMultiplier;
  }, [gameData, selectedOption, stakeAmount, confidence]);

  const submitBet = useCallback(
    async (onSubmit?: SubmitBetHandler) => {
      if (!selectedOption || !gameData || isSubmitting) return;

      setIsSubmitting(true);

      try {
        const betData: SubmitBetData = {
          gameId: gameData.id,
          optionId: selectedOption,
          stakeAmount,
          confidence,
          expectedReturn: calculateExpectedReturn(),
        };

        if (onSubmit) {
          await onSubmit(betData);
        }

        closeModal();
      } catch (error) {
        // 에러 처리 로직 추가 필요
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedOption,
      gameData,
      stakeAmount,
      confidence,
      calculateExpectedReturn,
      isSubmitting,
      closeModal,
    ]
  );

  const canProceedToNext = useCallback(() => {
    switch (step) {
      case 1:
        return selectedOption !== null;
      case 2:
        return stakeAmount > 0 && confidence > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, selectedOption, stakeAmount, confidence]);

  const getSelectedOptionData = useCallback(() => {
    if (!gameData || !selectedOption) return null;
    return gameData.options.find((opt) => opt.id === selectedOption) || null;
  }, [gameData, selectedOption]);

  return {
    // State
    isOpen,
    gameData,
    step,
    selectedOption,
    stakeAmount,
    confidence,
    isSubmitting,

    // Actions
    openModal,
    closeModal,
    nextStep,
    prevStep,
    goToStep,
    selectOption,
    updateStakeAmount,
    updateConfidence,
    submitBet,

    // Computed
    canProceedToNext: canProceedToNext(),
    expectedReturn: calculateExpectedReturn(),
    selectedOptionData: getSelectedOptionData(),

    // Utilities
    calculateExpectedReturn,
  };
};
