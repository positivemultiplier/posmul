import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { StudyAuthProvider } from "@/components/auth/study-auth-provider";
import { StudyCurriculumProvider } from "@/lib/study-curriculum-store";
import { GlobalUxProvider } from "@/components/mobile/global-ux-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housing-Pro | 수험 타이머 · 10분 플래너 · 기출 문제은행",
  description:
    "주택관리사 수험생을 위한 심플 그룹 타이머, 모트모트 10분 플래너, 0ms 기출 문제풀이 및 현직 소장 Pro 워크스페이스",
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
  themeColor: "#0B0B0D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--hp-outer)] text-[var(--hp-text)] antialiased">
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
