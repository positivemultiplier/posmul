"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, MessageSquare, Heart, Wallet, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/prediction", label: "예측", icon: TrendingUp },
  { href: "/forum/agora", label: "아고라", icon: MessageSquare },
  { href: "/donation", label: "기부", icon: Heart },
  { href: "/wallet", label: "지갑", icon: Wallet },
];

export function BottomNavigation() {
  const pathname = usePathname();

  // 관리자 페이지에서는 하단 플로팅바 숨김
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-md mx-auto bg-slate-950/85 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-1.5 shadow-[0_10px_35px_rgba(15,23,42,0.85)] flex items-center justify-around relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10 pointer-events-none" />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-2 px-3.5 rounded-2xl transition-all group"
            >
              {/* Active Background Capsule Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/50 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? "text-purple-300 scale-110 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    isActive ? "text-purple-200 font-bold" : "text-slate-400 group-hover:text-slate-300"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Active Dot Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeDot"
                  className="w-1 h-1 rounded-full bg-purple-300 shadow-[0_0_6px_#c084fc] absolute -bottom-0.5"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
