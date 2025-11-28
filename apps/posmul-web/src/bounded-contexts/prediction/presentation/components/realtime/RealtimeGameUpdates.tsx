import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import useRealtimeGameData from '../../hooks/useRealtimeGameData';

export default function RealtimeGameUpdates({ gameId, className = '' }) {
  const { gameData, isConnected, getRecentBets, getTotalStaked, getParticipantCount } = useRealtimeGameData({
    gameIds: [gameId],
    autoConnect: true,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [showActivity, setShowActivity] = useState(false);

  const currentGameData = gameData[gameId];
  const recentBets = getRecentBets(gameId);
  const totalStaked = getTotalStaked(gameId);
  const participantCount = getParticipantCount(gameId);

  // 실시간 액티비티 업데이트
  useEffect(() => {
    if (recentBets.length > 0) {
      const newActivity = recentBets.slice(0, 5).map((bet, index) => ({
        id: `${bet.userId}-${bet.timestamp}-${index}`,
        type: 'NEW_BET',
        message: `새로운 베팅: ${bet.option}에 ${bet.amount} PMP`,
        timestamp: bet.timestamp,
        data: bet,
      }));
      setRecentActivity(newActivity);
    }
  }, [recentBets]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">실시간 업데이트</h3>
            {isConnected && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
            )}
          </div>
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showActivity ? '숨기기' : '활동 보기'}
          </button>
        </div>
      </div>

      {/* 실시간 통계 */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* 총 베팅 금액 */}
          <motion.div
            className="text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-center mb-1">
              <CurrencyDollarIcon className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-xs text-gray-600">총 베팅</span>
            </div>
            <motion.p
              key={totalStaked}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-green-600"
            >
              {totalStaked.toLocaleString()} PMP
            </motion.p>
          </motion.div>

          {/* 참여자 수 */}
          <motion.div
            className="text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-1">
              <UserGroupIcon className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-xs text-gray-600">참여자</span>
            </div>
            <motion.p
              key={participantCount}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-blue-600"
            >
              {participantCount}명
            </motion.p>
          </motion.div>

          {/* 마지막 업데이트 */}
          <motion.div
            className="text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center mb-1">
              <ClockIcon className="w-4 h-4 text-gray-600 mr-1" />
              <span className="text-xs text-gray-600">마지막</span>
            </div>
            <p className="text-sm font-medium text-gray-800">
              {currentGameData?.lastUpdate ?
                new Date(currentGameData.lastUpdate).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '--:--:--'
              }
            </p>
          </motion.div>
        </div>

        {/* 확률 변화 표시 */}
        {currentGameData?.probabilities && Object.keys(currentGameData.probabilities).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">현재 확률</h4>
            <div className="space-y-2">
              {Object.entries(currentGameData.probabilities).map(([option, probability]) => (
                <motion.div
                  key={option}
                  initial={{ width: 0 }}
                  animate={{ width: `${probability}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="relative"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{option}</span>
                    <span className="font-bold text-gray-900">{probability.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${probability}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 실시간 활동 피드 */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">최근 활동</h4>

              {recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString('ko-KR')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {isConnected ? '실시간 활동을 대기 중입니다.' : '실시간 연결을 확인하세요.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
