import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housing-Pro | 주택관리사 수험·실무 코파일럿",
  description: "선지 단위 O/★/X 분해 기출문제집, AI 종이책 비전 스캔, 과태료 방어 법정 의무 스케줄러",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#070709] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

