"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface NumberTickerProps {
    value: number;
    direction?: "up" | "down";
    className?: string;
    delay?: number; // delay in seconds
    decimalPlaces?: number;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
    value,
    direction = "up",
    delay = 0,
    className = "",
    decimalPlaces = 0,
}) => {
    const ref = useSpring(direction === "down" ? value : 0, {
        stiffness: 100,
        damping: 30,
        mass: 1,
    });
    const displayValue = useTransform(ref, (current) =>
        current.toLocaleString("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        })
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            ref.set(direction === "down" ? 0 : value);
        }, delay * 1000);
        return () => clearTimeout(timeout);
    }, [value, direction, delay, ref]);

    return <motion.span className={className}>{displayValue}</motion.span>;
};
