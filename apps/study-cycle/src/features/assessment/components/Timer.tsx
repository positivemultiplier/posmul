'use client';

import { useState, useEffect } from 'react';

// React Native 환경에서 글로벌 timer 함수들 선언
declare const setInterval: (callback: () => void, ms: number) => number;
declare const clearInterval: (id: number) => void;

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
}

export const Timer = ({ initialTime, onTimeUp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`font-mono text-lg font-semibold px-3 py-1 rounded-md ${
        timeLeft < 60 ? 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/50' : 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-700'
    }`}>
      {formatTime(timeLeft)}
    </div>
  );
}; 