import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import useRealtimeGameData from '../../hooks/useRealtimeGameData';

export default function RealtimeConnectionStatus({
  gameIds = [],
  userId,
  className = '',
  showDetails = false,
  onConnectionChange,
}) {
  const {
    isConnected,
    isLoading,
    connectionError,
    updateCount,
    connect,
    disconnect,
  } = useRealtimeGameData({ gameIds, userId });

  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState('');

  // 연결 상태 변경 알림
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  // 업데이트 시간 추적
  useEffect(() => {
    if (updateCount > 0) {
      setLastUpdateTime(new Date().toLocaleTimeString('ko-KR'));
    }
  }, [updateCount]);

  const getStatusIcon = () => {
    if (isLoading) {
      return <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-500" />;
    }

    if (connectionError) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    }

    if (isConnected) {
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    }

    return <SignalIcon className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return '연결 중...';
    if (connectionError) return '연결 오류';
    if (isConnected) return '실시간 연결됨';
    return '연결 안됨';
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (connectionError) return 'bg-red-100 border-red-300 text-red-800';
    if (isConnected) return 'bg-green-100 border-green-300 text-green-800';
    return 'bg-gray-100 border-gray-300 text-gray-600';
  };

  return (
    <div className={`relative ${className}`}>
      {/* 연결 상태 표시기 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer ${getStatusColor()}`}
        onClick={() => setShowStatusPanel(!showStatusPanel)}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {isConnected && updateCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
        )}
      </motion.div>

      {/* 상세 상태 패널 */}
      <AnimatePresence>
        {showStatusPanel && showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">실시간 연결 상태</h3>
              <button
                onClick={() => setShowStatusPanel(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* 연결 정보 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">연결 상태</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">업데이트 수</span>
                <span className="text-sm font-medium">{updateCount}회</span>
              </div>

              {lastUpdateTime && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">마지막 업데이트</span>
                  <span className="text-sm font-medium">{lastUpdateTime}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">감시 중인 게임</span>
                <span className="text-sm font-medium">{gameIds.length}개</span>
              </div>

              {connectionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">연결 오류</p>
                      <p className="text-xs text-red-600 mt-1">{connectionError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                {!isConnected && !isLoading && (
                  <button
                    onClick={connect}
                    className="flex-1 bg-blue-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    재연결
                  </button>
                )}
                {isConnected && (
                  <button
                    onClick={disconnect}
                    className="flex-1 bg-gray-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    연결 해제
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
