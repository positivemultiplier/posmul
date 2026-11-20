import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { StudyAuthProvider } from "@/components/auth/study-auth-provider";
import { StudyCurriculumProvider } from "@/lib/study-curriculum-store";
import { GlobalUxProvider } from "@/components/mobile/global-ux-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housing-Pro | Power J 스터디 · 기출 꼬리물기 지식 그래프",
  description:
    "Power J 회독 플래너 · 집중 타이머 · 주택관리사 기출 한정 꼬리물기 지식 그래프 & 현직 소장 Pro Second Brain",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Housing-Pro",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#121216",
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
        <StudyAuthProvider>
          <StudyCurriculumProvider>
            <GlobalUxProvider>{children}</GlobalUxProvider>
          </StudyCurriculumProvider>
        </StudyAuthProvider>
        <Analytics />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
