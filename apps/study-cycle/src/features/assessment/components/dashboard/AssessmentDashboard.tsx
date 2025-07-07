'use client';

/**
 * @file AssessmentDashboard.tsx
 * @description Client component that renders the assessment results dashboard.
 * It receives assessment data and visualizes it.
 */
import { AssessmentResultDto } from '../../../../types/study-cycle-types';

interface AssessmentDashboardProps {
  initialData: AssessmentResultDto;
}

export function AssessmentDashboard({ initialData }: AssessmentDashboardProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">{initialData.title}</h1>
      <p className="text-gray-600 mb-6">{initialData.description}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-700 font-semibold">Grade</p>
          <p className="text-3xl font-bold text-blue-900">{initialData.grade}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-semibold">Total Score</p>
          <p className="text-3xl font-bold text-green-900">{initialData.totalScore} / {initialData.maxScore}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-yellow-700 font-semibold">Percentage</p>
          <p className="text-3xl font-bold text-yellow-900">{initialData.percentage?.toFixed(1) || '0'}%</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <p className="text-sm text-purple-700 font-semibold">Time Taken</p>
          <p className="text-3xl font-bold text-purple-900">{Math.round((initialData.timeTakenInSeconds || 0) / 60)} min</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Question Breakdown</h2>
      <div className="space-y-4">
        {initialData.questionResults.map((q, index) => (
          <div key={q.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Question {index + 1}: {q.title}</h3>
              {q.isCorrect ? (
                <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded-full">Correct</span>
              ) : (
                <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full">Incorrect</span>
              )}
            </div>
            <p className="text-gray-600 mb-3">{q.content}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Your Answer:</p>
                <p className="text-gray-700">{Array.isArray(q.userAnswer) ? q.userAnswer.join(', ') : q.userAnswer}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Correct Answer:</p>
                <p className="text-gray-700">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</p>
              </div>
            </div>
            {q.explanation && (
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <p className="font-semibold text-blue-800">Explanation:</p>
                  <p className="text-blue-700">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 