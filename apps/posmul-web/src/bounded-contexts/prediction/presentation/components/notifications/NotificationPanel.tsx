import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  Cog6ToothIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationPanel({ className = '' }) {
  const {
    notifications,
    stats,
    settings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateSettings,
  } = useNotifications();

  const [showPanel, setShowPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'urgent'
  const panelRef = useRef(null);

  // 외부 클릭시 패널 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPanel]);

  // 필터링된 알림들
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'urgent':
        return notifications.filter(n => n.priority === 'URGENT' || n.priority === 'HIGH');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      case 'HIGH':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 border-l-red-500';
      case 'HIGH':
        return 'bg-orange-50 border-l-orange-500';
      case 'MEDIUM':
        return 'bg-blue-50 border-l-blue-500';
      default:
        return 'bg-gray-50 border-l-gray-300';
    }
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {stats.unread > 0 ? (
          <BellSolidIcon className="w-6 h-6 text-blue-600" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}

        {stats.unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
          >
            {stats.unread > 99 ? '99+' : stats.unread}
          </motion.span>
        )}
      </button>

      {/* 알림 패널 */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col"
          >
            {/* 헤더 */}
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">알림</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="알림 설정"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="모든 알림 삭제"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 필터 탭 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체 ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  안읽음 ({stats.unread})
                </button>
                <button
                  onClick={() => setFilter('urgent')}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    filter === 'urgent'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  중요 ({stats.urgent + stats.high})
                </button>
              </div>

              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  모두 읽음으로 표시
                </button>
              )}
            </div>

            {/* 설정 패널 */}
            {showSettings && (
              <div className="border-b border-gray-100 p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">알림 설정</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => updateSettings({ enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">알림 활성화</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.sound}
                      onChange={(e) => updateSettings({ sound: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">사운드 알림</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.desktop}
                      onChange={(e) => updateSettings({ desktop: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">데스크톱 알림</span>
                  </label>
                </div>
              </div>
            )}

            {/* 알림 목록 */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      } ${getPriorityColor(notification.priority)} border-l-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getPriorityIcon(notification.priority)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {notification.message}
                            </p>

                            {notification.gameTitle && (
                              <p className="text-xs text-gray-600 mt-1">
                                게임: {notification.gameTitle}
                              </p>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.timestamp).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="읽음으로 표시"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="알림 제거"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex space-x-2 mt-3 pt-2 border-t border-gray-200">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={action.action}
                              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                action.style === 'primary'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : action.style === 'danger'
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
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
