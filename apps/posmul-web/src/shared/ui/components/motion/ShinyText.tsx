"use client";

import { CSSProperties, FC, ReactNode } from "react";

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
}

export const ShinyText: FC<ShinyTextProps> = ({
    text,
    disabled = false,
    speed = 5,
    className = "",
}) => {
    const animationDuration = `${speed}s`;

    return (
        <div
            className={`relative inline-block overflow-hidden ${className}`}
            style={
                {
                    "--shiny-width": "100%",
                    "--shiny-duration": animationDuration,
                } as CSSProperties
            }
        >
            <span
                className={`bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-500 to-gray-900 dark:from-white dark:via-gray-400 dark:to-white bg-[length:200%_100%] ${!disabled ? "animate-shine" : ""
                    }`}
            >
                {text}
            </span>
            <style jsx>{`
        @keyframes shine {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
        .animate-shine {
          animation: shine var(--shiny-duration) linear infinite;
        }
      `}</style>
        </div>
    );
};
