import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

/**
 * GET /api/donation/institutes
 * 기부 기관 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 활성화된 기부 기관 목록 조회
    const { data: institutes, error } = await supabase
      .schema("donation")
      .from("donation_institutes")
      .select("*")
      .eq("is_active", true)
      .order("trust_score", { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Institute fetch error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "기부 기관 조회 중 오류가 발생했습니다.",
          },
        },
        { status: 500 }
      );
    }

    // Array 방어 (Supabase schema access 이슈 대응)
    const instituteList = Array.isArray(institutes) ? institutes : [];

    return NextResponse.json({
      success: true,
      data: {
        institutes: instituteList.map((inst: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          website_url: string | null;
          contact_email: string | null;
          trust_score: number | null;
          is_verified: boolean;
        }) => ({
          id: inst.id,
          name: inst.name,
          description: inst.description,
          category: inst.category,
          websiteUrl: inst.website_url,
          contactEmail: inst.contact_email,
          trustScore: Number(inst.trust_score) || 0,
          isVerified: inst.is_verified,
        })),
        totalCount: instituteList.length,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("GET /api/donation/institutes error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
