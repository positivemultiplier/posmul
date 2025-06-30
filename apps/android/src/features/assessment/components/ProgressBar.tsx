'use client';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${safeProgress}%` }}
      ></div>
    </div>
  );
}; 