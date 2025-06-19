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
  keywords: ["예측게임", "직접민주주의", "지역경제", "PMC", "PMP", "포인트시스템"],
  authors: [{ name: "Posmul Team" }],
  viewport: "width=device-width, initial-scale=1",
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
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Posmul</h1>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="#" className="text-gray-500 hover:text-gray-900">예측 게임</a>
                  <a href="#" className="text-gray-500 hover:text-gray-900">Local League</a>
                  <a href="#" className="text-gray-500 hover:text-gray-900">Major League</a>
                  <a href="#" className="text-gray-500 hover:text-gray-900">대시보드</a>
                </nav>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">PMC: 0</span>
                  <span className="text-sm text-gray-600">PMP: 0</span>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
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
