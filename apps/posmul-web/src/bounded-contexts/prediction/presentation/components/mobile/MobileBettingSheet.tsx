"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export const MobileBettingSheet = ({
  isOpen,
  onClose,
  gameData,
  onSubmitBet
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setDragY(0);

    // 아래로 일정 거리 이상 드래그하면 닫기
    if (info.offset.y > 100) {
      onClose();
    }
  };

  const handleDrag = (event, info) => {
    if (info.offset.y > 0) {
      setDragY(info.offset.y);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isDragging ? dragY : 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              duration: isDragging ? 0 : 0.3
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-hidden shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {gameData?.title || '예측 게임'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Game Options */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">옵션 선택</h3>
                {gameData?.options?.map((option) => (
                  <motion.div
                    key={option.id}
                    whileTap={{ scale: 0.98 }}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{option.text}</span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: option.color }}
                      >
                        {option.probability}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: option.color,
                          width: `${option.probability}%`
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Bet Amounts */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">베팅 금액</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[1000, 5000, 10000].map((amount) => (
                    <motion.button
                      key={amount}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 px-4 border border-gray-300 rounded-lg text-center font-medium hover:border-blue-500 hover:bg-blue-50"
                    >
                      {amount.toLocaleString()} PMP
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Confidence Level */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">신뢰도</h3>
                <div className="flex space-x-2">
                  {[25, 50, 75, 90].map((confidence) => (
                    <motion.button
                      key={confidence}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-center text-sm font-medium hover:border-blue-500 hover:bg-blue-50"
                    >
                      {confidence}%
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-6 pt-4 border-t border-gray-200 bg-white">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // 베팅 로직 실행
                  if (onSubmitBet) {
                    onSubmitBet({
                      gameId: gameData?.id,
                      optionId: 1, // 선택된 옵션 ID
                      amount: 5000,
                      confidence: 75
                    });
                  }
                  onClose();
                }}
                className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors"
              >
                베팅하기
              </motion.button>

              {/* Safe area padding for newer phones */}
              <div className="h-6" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
