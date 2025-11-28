"use client";

import React from "react";
import { X, AlertTriangle, XCircle, AlertCircle, CheckCircle } from "lucide-react";

export type ErrorType = "error" | "warning" | "info" | "success";

interface ErrorDisplayProps {
  message: string;
  type?: ErrorType;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
  title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  type = "error",
  onDismiss,
  dismissible = true,
  className = "",
  title,
}) => {
  const getErrorStyles = () => {
    switch (type) {
      case "error":
        return {
          container: "bg-red-50 border-red-200 text-red-800",
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          button: "text-red-600 hover:text-red-800",
        };
      case "warning":
        return {
          container: "bg-yellow-50 border-yellow-200 text-yellow-800",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          button: "text-yellow-600 hover:text-yellow-800",
        };
      case "info":
        return {
          container: "bg-blue-50 border-blue-200 text-blue-800",
          icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
          button: "text-blue-600 hover:text-blue-800",
        };
      case "success":
        return {
          container: "bg-green-50 border-green-200 text-green-800",
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          button: "text-green-600 hover:text-green-800",
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200 text-gray-800",
          icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
          button: "text-gray-600 hover:text-gray-800",
        };
    }
  };

  const styles = getErrorStyles();

  return (
    <div
      className={`p-4 border rounded-lg flex items-start gap-3 ${styles.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {styles.icon}
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ml-2 p-1 rounded transition-colors ${styles.button}`}
          aria-label="오류 메시지 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;