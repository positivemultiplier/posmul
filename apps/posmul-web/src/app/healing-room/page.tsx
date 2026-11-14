/**
 * PosMul 힐링룸 미니홈피 SSR 페이지
 */
import type { Metadata } from "next";
import { createClient } from "../../lib/supabase/server";
import { HealingRoomClient } from "./HealingRoomClient";
import { loadHealingRoomData } from "./healing-room-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "힐링룸 미니홈피 | PosMul",
  description:
    "현실의 나를 잠시 내려놓고, 예측게임·공공 기부 활동과 나만의 미니룸으로 힐링하는 PosMul 감성 공간",
};

interface HealingRoomPageProps {
  searchParams?: Promise<{ userId?: string }> | { userId?: string };
}

export default async function HealingRoomPage({ searchParams }: HealingRoomPageProps) {
  let viewerUserId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? null;
  } catch {
    viewerUserId = null;
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const targetUserId =
    typeof resolvedSearchParams?.userId === "string" ? resolvedSearchParams.userId : null;

  const initialData = await loadHealingRoomData({
    viewerUserId,
    targetUserId,
    incrementVisit: true,
  });

  return <HealingRoomClient initialData={initialData} />;
}
