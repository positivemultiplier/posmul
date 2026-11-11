import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";
import { FetchRssItemsUseCase } from "@/bounded-contexts/feed/application/use-cases/fetch-rss-items.use-case";
import { FetchBillsUseCase } from "@/bounded-contexts/feed/application/use-cases/fetch-bills.use-case";
import { ClassifyContentUseCase } from "@/bounded-contexts/feed/application/use-cases/classify-content.use-case";
import { CreatePredictionDraftUseCase } from "@/bounded-contexts/feed/application/use-cases/create-prediction-draft.use-case";
import { SupabaseFeedRepository } from "@/bounded-contexts/feed/infrastructure/repositories/supabase-feed.repository";
import { GeminiClassifierAdapter } from "@/bounded-contexts/feed/infrastructure/adapters/gemini-classifier.adapter";
import { createClient } from "@supabase/supabase-js";
import { isFailure } from "@posmul/auth-economy-sdk";

// Edge Function 환경에서는 Node.js API(fs 등) 사용 주의. 
// 하지만 UseCase가 순수 로직이면 괜찮음. rss-parser는 node 의존성이 있을 수 있음.
// Next.js Route Handler (App Router)

export const dynamic = 'force-dynamic'; // static caching 방지
export const maxDuration = 60; // 60초 타임아웃 (Vercel/Next.js limit check)

// Helper to serialize errors
function formatError(error: any) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            ...error // capture other properties like 'code'
        };
    }
    return error;
}

export async function GET(request: NextRequest) {
    const auth = await requireAdminApi(request, { allowCronSecret: true });
    if (!auth.ok) return auth.response;

    const repo = new SupabaseFeedRepository();
    const classifier = new GeminiClassifierAdapter();

    const rssUseCase = new FetchRssItemsUseCase(repo, repo);
    const billUseCase = new FetchBillsUseCase(repo, process.env.OPEN_ASSEMBLY_API_KEY);
    const classifyUseCase = new ClassifyContentUseCase(repo, classifier);
    const draftUseCase = new CreatePredictionDraftUseCase(repo, classifier);

    const results = {
        rss: { success: false, error: null as any },
        bill: { success: false, error: null as any },
        classify: { success: false, stats: null as any, error: null as any },
        draft: { success: false, stats: null as any, error: null as any }
    };

    // 1. RSS Ingestion
    try {
        const rssResult = await rssUseCase.execute();
        if (isFailure(rssResult)) {
            results.rss.error = formatError(rssResult.error);
        } else {
            results.rss.success = true;
        }
    } catch (e) { results.rss.error = formatError(e); }

    // 2. Bill Ingestion
    try {
        // 22대 국회 (현재)
        const billResult = await billUseCase.execute(22);
        if (isFailure(billResult)) {
            results.bill.error = formatError(billResult.error);
        } else {
            results.bill.success = true;
        }
    } catch (e) { results.bill.error = formatError(e); }

    // 3. AI Classification
    try {
        const classifyResult = await classifyUseCase.execute(5); // 한 번에 5개씩 처리 (API Quota 고려)
        if (isFailure(classifyResult)) {
            results.classify.error = formatError(classifyResult.error);
        } else {
            results.classify.success = true;
            results.classify.stats = classifyResult.data;
        }
    } catch (e) { results.classify.error = formatError(e); }

    // 4. Draft Generation
    try {
        const draftResult = await draftUseCase.execute(5);
        if (isFailure(draftResult)) {
            results.draft.error = formatError(draftResult.error);
        } else {
            results.draft.success = true;
            results.draft.stats = draftResult.data;
        }
    } catch (e) { results.draft.error = formatError(e); }

    return NextResponse.json({
        message: "Ingestion process completed",
        results,
        timestamp: new Date().toISOString()
    });
}
