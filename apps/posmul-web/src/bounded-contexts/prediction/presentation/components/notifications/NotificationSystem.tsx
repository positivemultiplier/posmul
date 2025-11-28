import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationSystem({ className = '', maxVisible = 3 }) {
  const {
    notifications,
    markAsRead,
    removeNotification,
  } = useNotifications();

  // 보여질 알림들 (최신 순으로 제한)
  const visibleNotifications = notifications
    .filter(n => !n.isRead)
    .slice(0, maxVisible);

  // 자동 제거 (Low 우선순위는 5초 후 자동 제거)
  useEffect(() => {
    visibleNotifications.forEach(notification => {
      if (notification.priority === 'LOW') {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [visibleNotifications, removeNotification]);

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'MEDIUM':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'HIGH':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 max-w-sm ${className}`}>
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              transition: { delay: index * 0.1 }
            }}
            exit={{
              opacity: 0,
              x: 300,
              scale: 0.8,
              transition: { duration: 0.2 }
            }}
            className={`p-4 rounded-lg border-l-4 shadow-lg bg-white ${getPriorityStyles(notification.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getPriorityIcon(notification.priority)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="text-sm mt-1 text-gray-700">{notification.message}</p>

                  {notification.gameTitle && (
                    <p className="text-xs mt-1 text-gray-600">
                      게임: {notification.gameTitle}
                    </p>
                  )}

                  <p className="text-xs mt-2 text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString('ko-KR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                {/* 읽음 표시 버튼 */}
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                  title="읽음으로 표시"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>

                {/* 닫기 버튼 */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="알림 제거"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 액션 버튼들 */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex space-x-2 mt-3 pt-2 border-t border-gray-200">
                {notification.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
