'use client';

import { QuestionForSolvingDto } from '../../../types/study-cycle-types';
import { QuestionType, QuestionId } from '../../../types/study-cycle-types';

interface QuestionCardProps {
  question: QuestionForSolvingDto;
  userAnswer: string | string[] | undefined;
  onAnswerSelect: (questionId: QuestionId, answer: string | string[]) => void;
}

export const QuestionCard = ({ question, userAnswer, onAnswerSelect }: QuestionCardProps) => {

  const renderAnswerInput = () => {
    switch (question.type) {
      case QuestionType.MultipleChoice:
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              // 타입 가드: option이 객체인지 문자열인지 확인
              const optionId = typeof option === 'string' ? option : option.id;
              const optionText = typeof option === 'string' ? option : option.text;
              
              return (
                <label
                  key={optionId || index}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                    userAnswer === optionId
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/50 dark:border-blue-700'
                      : 'bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={optionId}
                    checked={userAnswer === optionId}
                    onChange={(e) => {
                      const target = e.target as unknown as { value: string };
                      onAnswerSelect(question.id, target.value);
                    }}
                    className="form-radio h-5 w-5 text-blue-600"
                  />
                  <span className="ml-4 text-gray-700 dark:text-gray-200">{optionText}</span>
                </label>
              );
            })}
          </div>
        );
      case QuestionType.ShortAnswer:
        return (
          <input
            type="text"
            value={userAnswer as string || ''}
            onChange={(e) => {
              const target = e.target as unknown as { value: string };
              onAnswerSelect(question.id, target.value);
            }}
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="답을 입력하세요..."
          />
        );
      // Add cases for other question types like MultipleSelect, Essay, etc.
      default:
        return <p>이 질문 유형은 지원되지 않습니다: {question.type}</p>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Question {question.difficulty}</span>
        <h2 className="text-xl font-bold mt-1 text-gray-800 dark:text-white">{question.title}</h2>
      </div>
      <p className="mb-6 text-gray-600 dark:text-gray-300">{question.content}</p>
      <div className="space-y-4">
        {renderAnswerInput()}
      </div>
    </div>
  );
}; 