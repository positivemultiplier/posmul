'use client';

import { QuestionForSolvingDto } from '../../application/dto/assessment-for-solving.dto';
import { QuestionType, QuestionId } from '../../domain/entities/assessment.entity';

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
            {question.options?.map((option) => (
              <label
                key={option.id}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                  userAnswer === option.id
                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/50 dark:border-blue-700'
                    : 'bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={userAnswer === option.id}
                  onChange={(e) => onAnswerSelect(question.id, e.target.value)}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-4 text-gray-700 dark:text-gray-200">{option.text}</span>
              </label>
            ))}
          </div>
        );
      case QuestionType.ShortAnswer:
        return (
          <input
            type="text"
            value={userAnswer as string || ''}
            onChange={(e) => onAnswerSelect(question.id, e.target.value)}
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