'use client';

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { Timer } from './Timer';
import { useAssessmentState } from '../hooks/useAssessmentState';

interface AssessmentContainerProps {
  userId?: string;
  assessmentId?: string;
}

export const AssessmentContainer: React.FC<AssessmentContainerProps> = ({
  userId: _userId,
  assessmentId: _assessmentId,
}) => {
  const {
    assessment,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    userAnswers,
    isFirstQuestion,
    isLastQuestion: _isLastQuestion,
    goToNextQuestion: _goToNextQuestion,
    goToPreviousQuestion: _goToPreviousQuestion,
    selectAnswer,
    submitAssessment,
  } = useAssessmentState();

  // Progress calculation
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <View style={styles.container}>
      {/* Header with progress and timer */}
      <View style={styles.headerCard}>
        <ProgressBar 
          progress={progress}
        />
        {assessment.timeLimit && (
          <Timer 
            initialTime={assessment.timeLimit}
            onTimeUp={submitAssessment}
          />
        )}
      </View>

      {/* Main question area */}
      <View style={styles.questionArea}>
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id]?.answer}
            onAnswerSelect={selectAnswer}
          />
        )}
      </View>

      {/* Navigation controls */}
      <View style={styles.navigationCard}>
        <View style={styles.navigationButtons}>
          {/* Previous button */}
          <View style={[styles.button, isFirstQuestion && styles.disabledButton]}>
            {/* Previous button */}
          </View>
          
          {/* Question counter */}
          <View style={styles.questionCounter}>
            {/* Question counter */}
          </View>
          
          {/* Next/Submit button */}
          <View style={styles.button}>
            {/* Next/Submit button */}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    marginBottom: 16,
    padding: 16,
  },
  questionArea: {
    flex: 1,
    marginBottom: 16,
  },
  navigationCard: {
    padding: 16,
    marginBottom: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  questionCounter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
}); 