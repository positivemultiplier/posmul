import { type ReactNode, Suspense } from "react";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "../bounded-contexts/prediction/presentation/utils/ThemeProvider";
import { BottomNavigation } from "../shared/ui/components/BottomNavigation";
import { ToastProvider } from "../shared/ui/components/feedback/Toast";
import { ThreeRowNavbar } from "../shared/ui/components/layout/ThreeRowNavbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PosMul - AI 시대 직접민주주의 & 소셜 임팩트 플랫폼",
  description:
    "AI 뉴스 예측 게임, 아고라 찬반 투표·의결권 위임, 기부 및 지역 소비 선순환 서비스",
  keywords: [
    "예측게임",
    "직접민주주의",
    "지역경제",
    "PMC",
    "PMP",
    "PMG",
    "소셜임팩트",
  ],
  authors: [{ name: "PosMul Team" }],
  openGraph: {
    title: "PosMul - AI 시대 직접민주주의 & 소셜 임팩트 플랫폼",
    description: "집단 지성 예측 게임과 기부/소비 선순환 통합 경제 플랫폼",
    siteName: "PosMul",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#090b12] text-slate-100`}
      >
        <ThemeProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen bg-[#090b12]">
              {/* Navigation */}
              <Suspense
                fallback={
                  <div className="fixed top-0 left-0 right-0 z-50 h-[60px] md:h-[142px] bg-[#0a0a0f] border-b border-white/10" />
                }
              >
                <ThreeRowNavbar />
              </Suspense>

              {/*
                ThreeRowNavbar가 fixed top-0 (Desktop: 142px, Mobile: 60px) 이므로 상단 패딩 확보,
                모바일 환경 하단 탭 바 확보를 위해 pb-20 추가.
              */}
              <main className="flex-1 pt-[60px] md:pt-[142px] pb-20 md:pb-0">
                {children}
              </main>

              {/* Mobile Bottom Navigation Bar */}
              <Suspense fallback={null}>
                <BottomNavigation />
              </Suspense>

              <footer className="bg-[#090b12] border-t border-white/5 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                  <div>
                    © 2026 PosMul. AI 시대 직접민주주의 & 소셜 임팩트 플랫폼
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PMP 공론·참여
                    </span>
                    <span>➔</span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Expect 집단지성
                    </span>
                    <span>➔</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      PMC 직접집행
                    </span>
                    <span>➔</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Honor 명예
                    </span>
                  </div>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
