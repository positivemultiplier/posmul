"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";
import Link from "next/link";
import { TrendingUp, Sparkles, MessageCircle } from "lucide-react";
import { Badge, Card } from "../shared/ui";

// Animation wrappers
export function FadeInClient({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
            {children}
        </motion.div>
    );
}

export function ScaleInClient({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

export function HoverLiftClient({ children }: { children: ReactNode }) {
    return (
        <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            {children}
        </motion.div>
    );
}

// Aliases for convenience
export { FadeInClient as FadeIn, ScaleInClient as ScaleIn, HoverLiftClient as HoverLift };

// Features grid component
interface Feature {
    icon: string;
    title: string;
    description: string;
    badges: string[];
    link: string;
    gradient: string;
}

export function StaggerContainerClient({ features }: { features: Feature[] }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const iconMap = {
        TrendingUp,
        Sparkles,
        MessageCircle,
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {features.map((feature, index) => {
                const Icon = iconMap[feature.icon as keyof typeof iconMap];
                return (
                    <motion.div
                        key={index}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        <HoverLiftClient>
                            <Card className={`p-8 bg-gradient-to-br ${feature.gradient} backdrop-blur-xl border border-white/10 rounded-2xl h-full`}>
                                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${feature.icon === 'TrendingUp' ? 'bg-blue-500/20' : feature.icon === 'Sparkles' ? 'bg-green-500/20' : 'bg-purple-500/20'} mb-6`}>
                                    <Icon className={`w-8 h-8 ${feature.icon === 'TrendingUp' ? 'text-blue-400' : feature.icon === 'Sparkles' ? 'text-green-400' : 'text-purple-400'}`} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-400 mb-6">{feature.description}</p>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {feature.badges.map((badge, i) => (
                                        <Badge
                                            key={i}
                                            variant="secondary"
                                            className={`${feature.icon === 'TrendingUp' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : feature.icon === 'Sparkles' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}
                                        >
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                                <Link
                                    href={feature.link}
                                    className={`block w-full text-center py-3 ${feature.icon === 'TrendingUp' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : feature.icon === 'Sparkles' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'} rounded-lg hover:opacity-80 transition-all duration-300 border`}
                                >
                                    {feature.icon === 'TrendingUp' ? '게임 둘러보기' : feature.icon === 'Sparkles' ? '투자 시작하기' : '포럼 참여하기'} →
                                </Link>
                            </Card>
                        </HoverLiftClient>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
