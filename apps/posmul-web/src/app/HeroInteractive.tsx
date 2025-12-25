"use client";

import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { FadeIn, HoverLift } from "./HomeClientComponents";

// --- Spotlight Component ---
function Spotlight({
    className = "",
    size = 400,
}: {
    className?: string;
    size?: number;
}) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const maskImage = useMotionTemplate`radial-gradient(
    ${size}px circle at ${mouseX}px ${mouseY}px,
    transparent,
    black
  )`;

    // 반전된 마스크 효과 (마우스 주변만 밝게)
    const style = { maskImage, WebkitMaskImage: maskImage };

    return (
        <div
            onMouseMove={handleMouseMove}
            className={`absolute inset-0 z-0 overflow-hidden ${className}`}
        >
            <div className="absolute inset-0 bg-transparent pointer-events-none" />

            {/* Spotlight Effect Layer */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={style}
            />
        </div>
    );
}

// --- Background Grid ---
function GridPattern() {
    return (
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }}
        />
    );
}

// --- Main Hero Component ---
export default function HeroInteractive() {
    return (
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center overflow-hidden border-b border-white/5">
            {/* Backgrounds */}
            <div className="absolute inset-0 bg-[#0a0a0f]" />
            <GridPattern />

            {/* Interactive Spotlight Overlay */}
            <div className="absolute inset-0 group">
                {/* Mouse following spotlight */}
                <div className="absolute inset-0 z-0 transition-opacity duration-1000">
                    <Spotlight className="from-blue-600/30 via-purple-600/30 to-blue-600/30" size={600} />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Badge */}
                <FadeIn delay={0.1}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 hover:bg-white/10 transition-colors cursor-default"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-cyan-100/80">AI Powered Prediction Market</span>
                    </motion.div>
                </FadeIn>

                {/* Main Title */}
                <FadeIn delay={0.2}>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8">
                        <span className="inline-block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent pb-4">
                            PosMul
                        </span>
                        <br />
                        <span className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-extrabold animate-gradient-x">
                            Collective Intelligence
                        </span>
                    </h1>
                </FadeIn>

                {/* Subtitle */}
                <FadeIn delay={0.3}>
                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                        당신의 예측이 가치가 되는 곳. <br className="hidden md:block" />
                        직접민주주의와 경제 시스템이 결합된 새로운 미래를 경험하세요.
                    </p>
                </FadeIn>

                {/* Buttons */}
                <FadeIn delay={0.4}>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <HoverLift>
                            <Link
                                href="/prediction"
                                className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative flex items-center gap-2">
                                    예측 시작하기 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </HoverLift>

                        <HoverLift>
                            <Link
                                href="/investment"
                                className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white text-lg font-semibold rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                            >
                                투자 참여하기
                            </Link>
                        </HoverLift>
                    </div>
                </FadeIn>
            </div>

            {/* Decorative Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-0" />
        </section>
    );
}
