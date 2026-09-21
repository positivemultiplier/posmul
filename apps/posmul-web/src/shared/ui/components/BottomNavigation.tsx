"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, MessageSquare, Heart, Wallet, ShieldAlert } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/prediction", label: "예측", icon: TrendingUp },
  { href: "/forum/agora", label: "아고라", icon: MessageSquare },
  { href: "/donation", label: "기부", icon: Heart },
  { href: "/wallet", label: "지갑", icon: Wallet },
];

export function BottomNavigation() {
  const pathname = usePathname();

  // 관리자 페이지나 특정 독립 경로에서는 하단바 숨김 처리
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-purple-900/40 px-2 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-purple-400 font-bold bg-purple-950/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
