"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TrendingUp, Sparkles, MessageCircle } from "lucide-react";
import { Badge } from "../shared/ui/components/base/Badge";
import { Card } from "../shared/ui/components/base/Card";

// 경량 CSS 트랜지션 래퍼 (framer-motion 및 카드별 IntersectionObserver 제거)
export function FadeInClient({
  children,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return <div className="transition-opacity duration-300">{children}</div>;
}

export function ScaleInClient({
  children,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return <div className="transition-transform duration-300">{children}</div>;
}

export function HoverLiftClient({ children }: { children: ReactNode }) {
  return (
    <div className="transition-transform duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02]">
      {children}
    </div>
  );
}

// Aliases for convenience
export {
  FadeInClient as FadeIn,
  ScaleInClient as ScaleIn,
  HoverLiftClient as HoverLift,
};

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
  const iconMap = {
    TrendingUp,
    Sparkles,
    MessageCircle,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => {
        const Icon = iconMap[feature.icon as keyof typeof iconMap];
        return (
          <div key={index}>
            <HoverLiftClient>
              <Card
                className={`p-8 bg-gradient-to-br ${feature.gradient} backdrop-blur-xl border border-white/10 rounded-2xl h-full`}
              >
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-2xl ${feature.icon === "TrendingUp" ? "bg-blue-500/20" : feature.icon === "Sparkles" ? "bg-green-500/20" : "bg-purple-500/20"} mb-6`}
                >
                  <Icon
                    className={`w-8 h-8 ${feature.icon === "TrendingUp" ? "text-blue-400" : feature.icon === "Sparkles" ? "text-green-400" : "text-purple-400"}`}
                  />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {feature.badges.map((badge, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className={`${feature.icon === "TrendingUp" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : feature.icon === "Sparkles" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30"}`}
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
                <Link
                  href={feature.link}
                  className={`block w-full text-center py-3 ${feature.icon === "TrendingUp" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : feature.icon === "Sparkles" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30"} rounded-lg hover:opacity-80 transition-all duration-300 border`}
                >
                  {feature.icon === "TrendingUp"
                    ? "게임 둘러보기"
                    : feature.icon === "Sparkles"
                      ? "투자 시작하기"
                      : "포럼 참여하기"}{" "}
                  →
                </Link>
              </Card>
            </HoverLiftClient>
          </div>
        );
      })}
    </div>
  );
}
