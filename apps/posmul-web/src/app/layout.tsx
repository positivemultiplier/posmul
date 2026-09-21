import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThreeRowNavbar } from "../shared/ui/components/layout/ThreeRowNavbar";
import { BottomNavigation } from "../shared/ui/components/BottomNavigation";
import { ThemeProvider } from "../bounded-contexts/prediction/presentation/utils/ThemeProvider";
import { ToastProvider } from "../shared/ui/components/feedback/Toast";
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
  description: "AI 뉴스 예측 게임, 아고라 찬반 투표·의결권 위임, 기부 및 지역 소비 선순환 서비스",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
              {/* Navigation */}
              <ThreeRowNavbar />

              {/*
                ThreeRowNavbar가 fixed top-0 이므로 상단 패딩 확보,
                모바일 환경 하단 탭 바 확보를 위해 pb-16 추가.
              */}
              <main className="flex-1 pt-16 md:pt-[152px] pb-16 md:pb-0">{children}</main>

              {/* Mobile Bottom Navigation Bar */}
              <BottomNavigation />

              <footer className="bg-[#0a0a0f] border-t border-white/10 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="text-center text-sm text-gray-400">
                    © 2026 PosMul. AI 시대 직접민주주의 & 소셜 임팩트 플랫폼
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

// Next.js 15: viewport 메타데이터 분리 export
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

