/**
 * 기본 버튼 컴포넌트
 */

import React from 'react';
import { cn } from '../../../utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, fullWidth, children, disabled, ...props }, ref) => {
    const baseClasses = [
      // 기본 스타일
      'inline-flex items-center justify-center rounded-md font-medium',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',

      // 전체 너비
      fullWidth && 'w-full',

      // 사이즈별 스타일
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-sm',
      size === 'lg' && 'px-6 py-3 text-base',

      // variant별 스타일
      variant === 'default' && [
        'bg-gray-100 text-gray-900 border border-gray-300',
        'hover:bg-gray-200 focus:ring-gray-500'
      ],
      variant === 'primary' && [
        'bg-blue-600 text-white',
        'hover:bg-blue-700 focus:ring-blue-500'
      ],
      variant === 'secondary' && [
        'bg-gray-600 text-white',
        'hover:bg-gray-700 focus:ring-gray-500'
      ],
      variant === 'danger' && [
        'bg-red-600 text-white',
        'hover:bg-red-700 focus:ring-red-500'
      ],
      variant === 'ghost' && [
        'bg-transparent text-gray-900 hover:bg-gray-100',
        'focus:ring-gray-500'
      ],
      variant === 'outline' && [
        'bg-transparent text-gray-900 border border-gray-300',
        'hover:bg-gray-50 focus:ring-gray-500'
      ],
    ];

    return (
      <button
        className={cn(baseClasses, className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
