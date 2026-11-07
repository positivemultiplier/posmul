import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  DEFAULT_PERSONALIZATION,
  type UserPersonalizationSettings,
} from "../../../dashboard/personalization-types";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || DEMO_USER_ID;
    const isAuthenticated = !!user;
    const admin = getAdminClient();

    const [profileRes, accountRes, scoreRes] = await Promise.all([
      admin
        .schema("user")
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmp_balance, pmc_balance")
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .schema("ranking")
        .from("user_scores")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const profile = profileRes.data;
    const account = accountRes.data;
    const score = scoreRes.data;

    const rawNotif = (profile?.notification_preferences || {}) as Record<string, any>;
    const rawPrivacy = (profile?.privacy_settings || {}) as Record<string, any>;
    const savedPersonalization = (rawNotif.personalization || {}) as Partial<UserPersonalizationSettings>;

    const personalization: UserPersonalizationSettings = {
      avatarEmoji: savedPersonalization.avatarEmoji || DEFAULT_PERSONALIZATION.avatarEmoji,
      sido: score?.sido || savedPersonalization.sido || DEFAULT_PERSONALIZATION.sido,
      jobGroup: score?.job_group || savedPersonalization.jobGroup || DEFAULT_PERSONALIZATION.jobGroup,
      favoriteDomains:
        Array.isArray(savedPersonalization.favoriteDomains) &&
        savedPersonalization.favoriteDomains.length > 0
          ? savedPersonalization.favoriteDomains
          : DEFAULT_PERSONALIZATION.favoriteDomains,
      favoriteLiveCategories:
        Array.isArray(savedPersonalization.favoriteLiveCategories) &&
        savedPersonalization.favoriteLiveCategories.length > 0
          ? savedPersonalization.favoriteLiveCategories
          : DEFAULT_PERSONALIZATION.favoriteLiveCategories,
      defaultBetPmp: Number(savedPersonalization.defaultBetPmp) || DEFAULT_PERSONALIZATION.defaultBetPmp,
      defaultConfidence:
        Number(savedPersonalization.defaultConfidence) || DEFAULT_PERSONALIZATION.defaultConfidence,
      defaultLanding: savedPersonalization.defaultLanding || DEFAULT_PERSONALIZATION.defaultLanding,
      notifications: {
        settlementAlert:
          savedPersonalization.notifications?.settlementAlert ??
          DEFAULT_PERSONALIZATION.notifications.settlementAlert,
        liveRoomAlert:
          savedPersonalization.notifications?.liveRoomAlert ??
          DEFAULT_PERSONALIZATION.notifications.liveRoomAlert,
        moneyWaveAlert:
          savedPersonalization.notifications?.moneyWaveAlert ??
          DEFAULT_PERSONALIZATION.notifications.moneyWaveAlert,
        forumReplyAlert:
          savedPersonalization.notifications?.forumReplyAlert ??
          DEFAULT_PERSONALIZATION.notifications.forumReplyAlert,
      },
      privacy: {
        profilePublic:
          rawPrivacy.profile_public ??
          savedPersonalization.privacy?.profilePublic ??
          DEFAULT_PERSONALIZATION.privacy.profilePublic,
        rankingPublic:
          rawPrivacy.ranking_public ??
          savedPersonalization.privacy?.rankingPublic ??
          DEFAULT_PERSONALIZATION.privacy.rankingPublic,
        predictionHistoryPublic:
          rawPrivacy.activity_public ??
          savedPersonalization.privacy?.predictionHistoryPublic ??
          DEFAULT_PERSONALIZATION.privacy.predictionHistoryPublic,
      },
    };

    return NextResponse.json({
      success: true,
      isAuthenticated,
      userId,
      email: user?.email || "citizen@posmul.com",
      displayName:
        profile?.display_name ||
        user?.user_metadata?.display_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "PosMul 주권시민",
      username: profile?.username || user?.email?.split("@")[0] || "posmul_citizen",
      bio: profile?.bio || "집단지성과 공인 오라클 데이터로 미래를 예측하는 PosMul 시민입니다.",
      onboardingCompleted: Boolean(profile?.onboarding_completed),
      balances: {
        pmp: Number(account?.pmp_balance ?? 15000),
        pmc: Number(account?.pmc_balance ?? 3500),
      },
      personalization,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "프로필 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || DEMO_USER_ID;
    const body = await request.json();
    const admin = getAdminClient();

    const displayName = (body.displayName || "PosMul 시민").trim();
    const bio = (body.bio || "").trim();
    const personalization: UserPersonalizationSettings = {
      avatarEmoji: body.personalization?.avatarEmoji || DEFAULT_PERSONALIZATION.avatarEmoji,
      sido: body.personalization?.sido || DEFAULT_PERSONALIZATION.sido,
      jobGroup: body.personalization?.jobGroup || DEFAULT_PERSONALIZATION.jobGroup,
      favoriteDomains:
        Array.isArray(body.personalization?.favoriteDomains) &&
        body.personalization.favoriteDomains.length > 0
          ? body.personalization.favoriteDomains
          : DEFAULT_PERSONALIZATION.favoriteDomains,
      favoriteLiveCategories:
        Array.isArray(body.personalization?.favoriteLiveCategories) &&
        body.personalization.favoriteLiveCategories.length > 0
          ? body.personalization.favoriteLiveCategories
          : DEFAULT_PERSONALIZATION.favoriteLiveCategories,
      defaultBetPmp:
        Number(body.personalization?.defaultBetPmp) || DEFAULT_PERSONALIZATION.defaultBetPmp,
      defaultConfidence:
        Number(body.personalization?.defaultConfidence) ||
        DEFAULT_PERSONALIZATION.defaultConfidence,
      defaultLanding:
        body.personalization?.defaultLanding || DEFAULT_PERSONALIZATION.defaultLanding,
      notifications: {
        settlementAlert: Boolean(body.personalization?.notifications?.settlementAlert ?? true),
        liveRoomAlert: Boolean(body.personalization?.notifications?.liveRoomAlert ?? true),
        moneyWaveAlert: Boolean(body.personalization?.notifications?.moneyWaveAlert ?? true),
        forumReplyAlert: Boolean(body.personalization?.notifications?.forumReplyAlert ?? false),
      },
      privacy: {
        profilePublic: Boolean(body.personalization?.privacy?.profilePublic ?? true),
        rankingPublic: Boolean(body.personalization?.privacy?.rankingPublic ?? true),
        predictionHistoryPublic: Boolean(
          body.personalization?.privacy?.predictionHistoryPublic ?? true
        ),
      },
    };

    const now = new Date().toISOString();

    // 1. user.profiles 업데이트 (로그인 유저인 경우 DB에 영구 저장)
    if (user) {
      const { data: existingProfile } = await admin
        .schema("user")
        .from("profiles")
        .select("id, username, notification_preferences, privacy_settings")
        .eq("id", userId)
        .maybeSingle();

      const updatedNotif = {
        ...((existingProfile?.notification_preferences as Record<string, any>) || {}),
        email: true,
        push: personalization.notifications.settlementAlert,
        personalization,
      };

      const updatedPrivacy = {
        ...((existingProfile?.privacy_settings as Record<string, any>) || {}),
        profile_public: personalization.privacy.profilePublic,
        ranking_public: personalization.privacy.rankingPublic,
        activity_public: personalization.privacy.predictionHistoryPublic,
      };

      if (existingProfile) {
        await admin
          .schema("user")
          .from("profiles")
          .update({
            display_name: displayName,
            bio,
            notification_preferences: updatedNotif,
            privacy_settings: updatedPrivacy,
            onboarding_completed: true,
            updated_at: now,
          })
          .eq("id", userId);
      } else {
        const username = user.email?.split("@")[0] || `user_${userId.slice(0, 8)}`;
        await admin
          .schema("user")
          .from("profiles")
          .insert({
            id: userId,
            username,
            display_name: displayName,
            bio,
            notification_preferences: updatedNotif,
            privacy_settings: updatedPrivacy,
            onboarding_completed: true,
            account_status: "active",
            email_verified: !!user.email_confirmed_at,
            created_at: now,
            updated_at: now,
          });
      }

      // 2. ranking.user_scores 시/도 및 직군 동기화
      const { data: existingScore } = await admin
        .schema("ranking")
        .from("user_scores")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingScore) {
        await admin
          .schema("ranking")
          .from("user_scores")
          .update({
            sido: personalization.sido,
            job_group: personalization.jobGroup,
            updated_at: now,
          })
          .eq("user_id", userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: "개인맞춤 설정 및 시민 프로필이 저장되었습니다.",
      displayName,
      bio,
      onboardingCompleted: true,
      personalization,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "설정 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || DEMO_USER_ID;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "claim_bonus";

    if (action !== "claim_bonus") {
      return NextResponse.json({ success: false, error: "지원하지 않는 액션입니다." }, { status: 400 });
    }

    const admin = getAdminClient();
    const BONUS_PMP = 5000;
    const BONUS_PMC = 500;

    const { data: existingAccount } = await admin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("user_id, pmp_balance, pmc_balance")
      .eq("user_id", userId)
      .maybeSingle();

    const newPmp = Number(existingAccount?.pmp_balance || 0) + BONUS_PMP;
    const newPmc = Number(existingAccount?.pmc_balance || 0) + BONUS_PMC;
    const now = new Date().toISOString();

    if (existingAccount) {
      await admin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({
          pmp_balance: newPmp,
          pmc_balance: newPmc,
          updated_at: now,
        })
        .eq("user_id", userId);
    } else if (user) {
      await admin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .insert({
          user_id: userId,
          pmp_balance: 10000 + BONUS_PMP,
          pmc_balance: 1000 + BONUS_PMC,
          created_at: now,
          updated_at: now,
        });
    }

    return NextResponse.json({
      success: true,
      message: `🎁 시민 활동 보너스 +${BONUS_PMP.toLocaleString()} PMP & +${BONUS_PMC.toLocaleString()} PMC가 즉시 충전되었습니다!`,
      pmpBalance: existingAccount ? newPmp : 15000,
      pmcBalance: existingAccount ? newPmc : 1500,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "보너스 지급 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

