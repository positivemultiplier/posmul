'use client';

import { useAssessmentState } from '../hooks/useAssessmentState';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { Timer } from './Timer';

export const AssessmentContainer = () => {
  const {
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
  } = useAssessmentState();

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 w-full transition-all duration-300">
      <header className="mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{assessment.title}</h1>
            {assessment.timeLimit && <Timer initialTime={assessment.timeLimit} onTimeUp={submitAssessment} />}
        </div>
        <p className="text-gray-600 dark:text-gray-300">{assessment.description}</p>
        <ProgressBar progress={progress} />
      </header>

      <main>
        <QuestionCard 
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id]?.answer}
            onAnswerSelect={selectAnswer}
        />
      </main>

      <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <button
          onClick={goToPreviousQuestion}
          disabled={isFirstQuestion}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          이전
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentQuestionIndex + 1} / {totalQuestions}
        </div>
        {isLastQuestion ? (
          <button
            onClick={submitAssessment}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            제출하기
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다음
          </button>
        )}
      </footer>
    </div>
  );
}; 