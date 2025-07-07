'use client';

import { useState, useMemo } from 'react';
import { useAssessment } from '../components/AssessmentContext';
import { QuestionForSolvingDto } from '../../../types/study-cycle-types';
import { QuestionId } from '../../../types/study-cycle-types';

export type UserAnswer = {
  questionId: QuestionId;
  answer: string | string[];
};

export const useAssessmentState = () => {
  const { assessment } = useAssessment();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<QuestionId, UserAnswer>>({});

  const currentQuestion: QuestionForSolvingDto = useMemo(() => {
    return assessment.questions[currentQuestionIndex];
  }, [assessment.questions, currentQuestionIndex]);

  const totalQuestions = assessment.questions.length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const goToNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const selectAnswer = (questionId: QuestionId, answer: string | string[]) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, answer },
    }));
  };

  const submitAssessment = () => {
    console.log('Submitting assessment with answers:', userAnswers);
    // Here we would call a use case to submit the assessment
    // For now, we'll just log it.
  };
  
  return {
    assessment,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    userAnswers,
    isFirstQuestion,
    isLastQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    selectAnswer,
    submitAssessment,
  };
}; 