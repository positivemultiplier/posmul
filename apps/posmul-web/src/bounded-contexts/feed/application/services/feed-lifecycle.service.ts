import { supabaseAdmin } from "@/lib/supabase/admin";
import { schedulerConfigService } from "@/bounded-contexts/prediction/application/services/scheduler-config.service";

export interface FeedLifecycleSummary {
  expiredPendingCount: number;
  trimmedPendingCount: number;
  expiredClassifiedCount: number;
  deletedIgnoredCount: number;
  deletedDraftCount: number;
  pendingTtlHours: number;
  ignoredRetentionDays: number;
  draftRetentionDays: number;
}

const DEFAULT_MAX_PENDING_QUEUE = 120;

/**
 * RSS 피드 큐(PENDING / CLASSIFIED / DRAFT_CREATED / IGNORED)의 무한 적체를 방지하기 위한
 * 4단계 슬라이딩 TTL 수명주기 관리 서비스
 */
export class FeedLifecycleService {
  async maintainLifecycle(options?: {
    maxPendingQueue?: number;
    force?: boolean;
  }): Promise<FeedLifecycleSummary> {
    const config = await schedulerConfigService.getSchedulerConfig();
    const maxPending = options?.maxPendingQueue ?? DEFAULT_MAX_PENDING_QUEUE;

    const summary: FeedLifecycleSummary = {
      expiredPendingCount: 0,
      trimmedPendingCount: 0,
      expiredClassifiedCount: 0,
      deletedIgnoredCount: 0,
      deletedDraftCount: 0,
      pendingTtlHours: config.feed_pending_ttl_hours,
      ignoredRetentionDays: config.feed_ignored_retention_days,
      draftRetentionDays: config.feed_draft_retention_days,
    };

    if (!config.auto_feed_cleanup_enabled && !options?.force) {
      return summary;
    }

    const now = Date.now();
    const pendingCutoffIso = new Date(
      now - config.feed_pending_ttl_hours * 60 * 60 * 1000
    ).toISOString();
    const classifiedCutoffIso = new Date(
      now - 72 * 60 * 60 * 1000
    ).toISOString();
    const ignoredCutoffIso = new Date(
      now - config.feed_ignored_retention_days * 24 * 60 * 60 * 1000
    ).toISOString();
    const draftCutoffIso = new Date(
      now - config.feed_draft_retention_days * 24 * 60 * 60 * 1000
    ).toISOString();
    const nowIso = new Date(now).toISOString();

    // 1. TTL 초과 PENDING -> IGNORED 만료 처리
    const { data: expiredPending } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .update({
        process_status: "IGNORED",
        processed_at: nowIso,
      })
      .eq("process_status", "PENDING")
      .lt("created_at", pendingCutoffIso)
      .select("id");
    summary.expiredPendingCount = expiredPending?.length ?? 0;

    // 2. 72시간 이상 미소화 CLASSIFIED -> IGNORED 만료 처리
    const { data: expiredClassified } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .update({
        process_status: "IGNORED",
        processed_at: nowIso,
      })
      .eq("process_status", "CLASSIFIED")
      .lt("created_at", classifiedCutoffIso)
      .select("id");
    summary.expiredClassifiedCount = expiredClassified?.length ?? 0;

    // 3. 슬라이딩 큐 상한(최신 maxPending건 초과 PENDING 정리)
    const { data: pendingRows } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .select("id")
      .eq("process_status", "PENDING")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(maxPending, maxPending + 500);

    if (pendingRows && pendingRows.length > 0) {
      const trimIds = pendingRows.map((r) => String(r.id));
      const { data: trimmed } = await supabaseAdmin
        .schema("feed")
        .from("items")
        .update({
          process_status: "IGNORED",
          processed_at: nowIso,
        })
        .in("id", trimIds)
        .select("id");
      summary.trimmedPendingCount = trimmed?.length ?? 0;
    }

    // 4. 보관 기간 경과 IGNORED 물리 삭제 (중복 수집 방지 최소 윈도우만 유지)
    const { data: deletedIgnored } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .delete()
      .eq("process_status", "IGNORED")
      .lt("created_at", ignoredCutoffIso)
      .select("id");
    summary.deletedIgnoredCount = deletedIgnored?.length ?? 0;

    // 5. 보관 기간 경과 DRAFT_CREATED / PUBLISHED 물리 삭제
    const { data: deletedDrafts } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .delete()
      .in("process_status", ["DRAFT_CREATED", "PUBLISHED"])
      .lt("created_at", draftCutoffIso)
      .select("id");
    summary.deletedDraftCount = deletedDrafts?.length ?? 0;

    return summary;
  }

  /**
   * Admin 수동 큐 초기화 (선택한 상태의 피드 항목 즉시 정리)
   */
  async purgeQueue(
    target: "pending" | "ignored" | "drafted" | "all-stale"
  ): Promise<{ affectedCount: number; message: string }> {
    const nowIso = new Date().toISOString();

    if (target === "pending") {
      const { data } = await supabaseAdmin
        .schema("feed")
        .from("items")
        .update({ process_status: "IGNORED", processed_at: nowIso })
        .eq("process_status", "PENDING")
        .select("id");
      const count = data?.length ?? 0;
      return {
        affectedCount: count,
        message: `대기 중이던 PENDING 기사 ${count}건을 IGNORED로 일괄 비웠습니다.`,
      };
    }

    if (target === "ignored") {
      const { data } = await supabaseAdmin
        .schema("feed")
        .from("items")
        .delete()
        .eq("process_status", "IGNORED")
        .select("id");
      const count = data?.length ?? 0;
      return {
        affectedCount: count,
        message: `폐기 완료(IGNORED) 기사 ${count}건을 DB에서 영구 삭제했습니다.`,
      };
    }

    if (target === "drafted") {
      const { data } = await supabaseAdmin
        .schema("feed")
        .from("items")
        .delete()
        .in("process_status", ["DRAFT_CREATED", "PUBLISHED"])
        .select("id");
      const count = data?.length ?? 0;
      return {
        affectedCount: count,
        message: `초안 생성 완료(DRAFT_CREATED/PUBLISHED) 아카이브 ${count}건을 정리했습니다.`,
      };
    }

    const res = await this.maintainLifecycle({ force: true });
    const total =
      res.expiredPendingCount +
      res.trimmedPendingCount +
      res.expiredClassifiedCount +
      res.deletedIgnoredCount +
      res.deletedDraftCount;
    return {
      affectedCount: total,
      message: `TTL 라이프사이클 정리 완료: PENDING만료=${res.expiredPendingCount}, 큐컷=${res.trimmedPendingCount}, CLASSIFIED만료=${res.expiredClassifiedCount}, IGNORED삭제=${res.deletedIgnoredCount}, DRAFT삭제=${res.deletedDraftCount}`,
    };
  }
}

export const feedLifecycleService = new FeedLifecycleService();
