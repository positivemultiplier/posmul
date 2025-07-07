import { Navbar } from "../shared/ui";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Posmul - AI 시대 직접민주주의 플랫폼",
  description: "예측 게임과 지역 경제 연동을 통한 직접민주주의 실험 플랫폼",
  keywords: [
    "예측게임",
    "직접민주주의",
    "지역경제",
    "PMC",
    "PMP",
    "포인트시스템",
  ],
  authors: [{ name: "Posmul Team" }],
  // viewport: "width=device-width, initial-scale=1",
};

// 임시 경제 정보 (추후 실제 API로 교체)
const mockEconomicBalance = {
  pmp: 12500,
  pmc: 8750,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <div className="flex flex-col min-h-screen">
          {/* 네비게이션바 */}
          <Navbar
            economicBalance={mockEconomicBalance}
            isAuthenticated={false}
          />

          <main className="flex-1">{children}</main>

          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-sm text-gray-500">
                © 2024 Posmul. AI 시대 직접민주주의 실험 플랫폼
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

// Next.js 15: viewport 메타데이터 분리 export
export const viewport = {
  width: "device-width",
  initialScale: 1,
};
