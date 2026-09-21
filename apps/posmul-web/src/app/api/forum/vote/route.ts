import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { topicId, voteType, pmgWeight } = body; // voteType: 'AGREE' | 'DISAGREE' | 'ABSTAIN'

    if (!topicId || !voteType) {
      return NextResponse.json({ success: false, error: "Missing topicId or voteType" }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000001";
    const weight = pmgWeight || 100; // PMG 거버넌스 가중치

    // 1. Supabase forum.votes 또는 forum.topics 업데이트 (없을 경우 덤 데이터 fallback)
    const { data: topic } = await supabase
      .schema("forum")
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .maybeSingle();

    if (topic) {
      const agreeVotes = (topic.agree_votes || 0) + (voteType === "AGREE" ? weight : 0);
      const disagreeVotes = (topic.disagree_votes || 0) + (voteType === "DISAGREE" ? weight : 0);

      await supabase
        .schema("forum")
        .from("topics")
        .update({
          agree_votes: agreeVotes,
          disagree_votes: disagreeVotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId);
    }

    return NextResponse.json({
      success: true,
      topicId,
      voteType,
      appliedWeight: weight,
      message: `성공적으로 '${voteType}' 표결이 반영되었습니다. (의결권: ${weight} PMG)`,
    });
  } catch (error: any) {
    console.error("Agora vote error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process vote" },
      { status: 500 }
    );
  }
}
