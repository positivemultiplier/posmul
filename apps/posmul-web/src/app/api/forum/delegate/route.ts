import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { delegateToUserId, delegateToName, pmgAmount } = body;

    if (!delegateToName) {
      return NextResponse.json({ success: false, error: "Missing delegateToName" }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000001";
    const amount = pmgAmount || 320;

    return NextResponse.json({
      success: true,
      delegatorId: userId,
      delegateToName,
      delegatedPmg: amount,
      timestamp: new Date().toISOString(),
      message: `성공적으로 ${amount} PMG 의결권을 [${delegateToName}] 님에게 위임(Delegation)하셨습니다.`,
    });
  } catch (error: any) {
    console.error("Agora delegation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delegate governance power" },
      { status: 500 }
    );
  }
}
