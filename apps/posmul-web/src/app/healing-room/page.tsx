/**
 * PosMul 힐링룸 미니홈피 SSR 페이지
 */
import type { Metadata } from "next";
import { createClient } from "../../lib/supabase/server";
import { HealingRoomClient } from "./HealingRoomClient";
import { loadHealingRoomData } from "./healing-room-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "힐링룸 창작 아틀리에 | PosMul",
  description:
    "나만의 내면 세계관을 설계하고 AI 음악 앨범·그림 전시회·소설 출판을 비상업 순수 창작으로 뽐내는 PosMul 힐링룸",
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
