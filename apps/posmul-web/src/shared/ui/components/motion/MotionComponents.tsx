"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type MotionDivProps = HTMLMotionProps<"div">;
type MotionSpanProps = HTMLMotionProps<"span">;

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

export const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
} as const;

export const slideUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

export const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
} as const;

export const cardHoverVariants = {
    initial: { scale: 1, y: 0, boxShadow: "0px 4px 10px rgba(0,0,0,0.05)" },
    hover: {
        scale: 1.02,
        y: -5,
        boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 },
} as const;

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

export const MotionDiv: React.FC<MotionDivProps> = ({ children, ...props }) => {
    return <motion.div {...props}>{children}</motion.div>;
};

export const MotionSpan: React.FC<MotionSpanProps> = ({ children, ...props }) => {
    return <motion.span {...props}>{children}</motion.span>;
};

/**
 * Premium Card wrapper with hover effects
 */
export const MotionCard: React.FC<MotionDivProps & { className?: string }> = ({ children, className, ...props }) => {
    return (
        <motion.div
            className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 ${className}`}
            variants={cardHoverVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
        >
            {children}
        </motion.div>
    );
};
