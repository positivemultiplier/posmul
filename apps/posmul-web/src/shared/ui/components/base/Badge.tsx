/**
 * Badge Component
 *
 * Reusable badge component for status indicators, tags, and labels
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "text-gray-700 border-gray-200 bg-white hover:bg-gray-50",
    success: "border-transparent bg-green-600 text-white hover:bg-green-700",
  };

  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className || ""}`}
      {...props}
    />
  );
}

export { Badge };
