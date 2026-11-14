"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Tv, TrendingUp, Heart, Trophy } from "lucide-react";
import { DOMAIN_PHILOSOPHY_MAP, type PosMulDomainKey } from "../tokens/domain-tones";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  domain: PosMulDomainKey;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/forum", label: "포럼", domain: "forum", icon: MessageSquare },
  { href: "/consume", label: "소비", domain: "consume", icon: Tv },
  { href: "/prediction", label: "예측", domain: "prediction", icon: TrendingUp },
  { href: "/donation", label: "기부", domain: "donation", icon: Heart },
  { href: "/ranking", label: "랭킹", domain: "ranking", icon: Trophy },
];

export function BottomNavigation() {
  const pathname = usePathname() || "/";

  if (pathname.startsWith("/admin") || pathname.startsWith("/healing-room")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <div className="max-w-md mx-auto bg-[#090b12]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center justify-around relative overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.domain === "prediction" && pathname === "/");
          const meta = DOMAIN_PHILOSOPHY_MAP[item.domain];

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all group"
            >
              {isActive && (
                <div
                  className={`absolute inset-0 rounded-xl transition-all duration-200 ${meta.tones.row2Active}`}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive
                      ? `${meta.tones.accentText} scale-110`
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span
                  className={`text-[10px] mt-0.5 transition-colors ${
                    isActive
                      ? "text-white font-bold"
                      : "text-slate-400 group-hover:text-slate-300 font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
