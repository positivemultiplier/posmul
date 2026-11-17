import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { StudyAuthProvider } from "@/components/auth/study-auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housing-Pro | 주택관리사 교재없는 올인원 학습·실무 코파일럿",
  description:
    "교재 없이 앱 하나로 69개 단원 개념·1,400제 기출·5,880선지 O/X 완전 정복 및 PosMul 계정 실시간 연동",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#070709] text-slate-100 antialiased">
        <StudyAuthProvider>{children}</StudyAuthProvider>
        <Analytics />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}

