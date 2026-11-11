import { isFailure } from "@posmul/auth-economy-sdk";
import { NextResponse } from "next/server";

import {
  getCreatePredictionDraftUseCase,
  getFetchRssItemsUseCase,
} from "@/bounded-contexts/feed/di-container";
import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import { getAutoSettleByBillUseCase } from "@/bounded-contexts/prediction/di-container";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const logs: string[] = [];

    // 2. RSS 뉴스 및 피드 수집
    const fetchRss = getFetchRssItemsUseCase();
    const rssRes = await fetchRss.execute({ category: "ALL" });
    if (isFailure(rssRes)) {
      logs.push(`RSS fetch failed: ${rssRes.error.message}`);
    } else {
      logs.push(
        `RSS fetched: ${rssRes.data.fetchedCount} items from ${rssRes.data.sourceCount} sources`
      );
    }

    // 3. AI 예측 게임 초안 생성 및 자동 발행
    const draftUseCase = getCreatePredictionDraftUseCase();
    const draftRes = await draftUseCase.execute(5);

    if (isFailure(draftRes)) {
      logs.push(`Draft creation failed: ${draftRes.error.message}`);
    } else {
      logs.push(
        `AI Prediction games drafted: ${draftRes.data.draftsCreated} games`
      );
    }

    // 4. 국회 의안 결과 기반 자동 정산 + 외부 오라클(DART/KOSIS/ECOS/KOBIS/FMP/Football) 자동 정산 실행
    const billSettleRes = await getAutoSettleByBillUseCase().execute();
    const oracleSettleRes =
      await settlementOrchestrator.runScheduledAutoSettlements();

    const billSettledCount = billSettleRes.success
      ? billSettleRes.data.settledGamesCount
      : 0;
    const autoSettledGamesCount =
      billSettledCount + oracleSettleRes.settledCount;

    if (billSettleRes.success) {
      logs.push(...billSettleRes.data.logs);
    }
    logs.push(...oracleSettleRes.logs);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      logs,
      autoSettledGamesCount,
      totalRewardDistributed: oracleSettleRes.totalRewardDistributed,
      message:
        "AI 예측 게임 자동 생성 및 오라클 기반 정산 크론 파이프라인이 성공적으로 실행되었습니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute prediction pipeline cron",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
