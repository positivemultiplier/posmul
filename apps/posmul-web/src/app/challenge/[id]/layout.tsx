import type { Metadata } from "next";
import type { ReactNode } from "react";

import { supabaseAdmin } from "@/lib/supabase/admin";

interface ChallengeOptionRow {
  label?: string;
  totalAmount?: number;
  pmp?: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let title = "친구와의 맞짱 내기 | PosMul";
  let description =
    "PosMul에서 친구들과 PMP 판돈을 걸고 가볍게 맞짱 예측을 겨뤄보세요!";

  try {
    const { data } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("title, host_name, options, total_pool_pmp, linked_game_title")
      .eq("id", id)
      .single();

    if (data) {
      const hostName = data.host_name || "호스트";
      const poolPmp = Number(data.total_pool_pmp || 0).toLocaleString();
      const prefix = data.linked_game_title ? "🔗 꼬리 내기" : "🥊 맞짱 도전장";

      const opts = (data.options as ChallengeOptionRow[]) || [];
      let ratioSummary = "";
      if (opts.length >= 2) {
        const amtA = Number(opts[0]?.totalAmount ?? opts[0]?.pmp ?? 0);
        const amtB = Number(opts[1]?.totalAmount ?? opts[1]?.pmp ?? 0);
        const sum = amtA + amtB;
        const ratioA = sum > 0 ? Math.round((amtA / sum) * 100) : 50;
        const ratioB = 100 - ratioA;
        ratioSummary = ` · 🔴 ${opts[0]?.label || "선택 A"}(${ratioA}%) vs 🔵 ${opts[1]?.label || "선택 B"}(${ratioB}%)`;
      }

      title = `${prefix} [${hostName}] "${data.title}" | PosMul`;
      description = `총 판돈 ${poolPmp} PMP${ratioSummary} — 지금 링크를 눌러 PMP 뺏어오기에 참전하세요!`;
    }
  } catch {
    // 메타데이터 조회 실패 시 기본 메타데이터 유지
  }

  const ogImageUrl = `/challenge/${id}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "PosMul",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ChallengeDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

