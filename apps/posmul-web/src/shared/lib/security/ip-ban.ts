import { createClient } from "@supabase/supabase-js";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * IP 차단 여부 검사
 */
export async function checkIsIpBanned(
  ip: string
): Promise<{ banned: boolean; reason?: string }> {
  try {
    const admin = getAdminClient();
    const { data: record, error } = await admin
      .schema("forum")
      .from("banned_ips")
      .select("id, ip_address, reason, expires_at, is_active")
      .eq("ip_address", ip)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !record) {
      return { banned: false };
    }

    // 만료일 검사 (만료 시 자동 해제)
    if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) {
      await admin
        .schema("forum")
        .from("banned_ips")
        .update({ is_active: false })
        .eq("id", record.id);
      return { banned: false };
    }

    return {
      banned: true,
      reason: record.reason || "비정상 활동 또는 스팸 방지 정책에 의해 차단된 IP입니다.",
    };
  } catch {
    return { banned: false };
  }
}

/**
 * IP 차단 등록
 */
export async function banIp(params: {
  ip: string;
  reason: string;
  bannedBy?: string;
  expiresAt?: Date | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .schema("forum")
      .from("banned_ips")
      .upsert(
        {
          ip_address: params.ip.trim(),
          reason: params.reason.trim(),
          banned_by: params.bannedBy || "system",
          is_active: true,
          expires_at: params.expiresAt ? params.expiresAt.toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ip_address" }
      );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "IP 차단 등록 실패" };
  }
}

/**
 * IP 차단 해제
 */
export async function unbanIp(ip: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .schema("forum")
      .from("banned_ips")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("ip_address", ip.trim());

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "IP 차단 해제 실패" };
  }
}

