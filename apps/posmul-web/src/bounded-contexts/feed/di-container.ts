import { SupabaseFeedRepository } from "./infrastructure/repositories/supabase-feed.repository";
import { FetchRssItemsUseCase } from "./application/use-cases/fetch-rss-items.use-case";
import { FetchBillsUseCase } from "./application/use-cases/fetch-bills.use-case";
import { FinancialMarketCollector } from "./infrastructure/collectors/financial-market.collector";
import { BoxOfficeCollector } from "./infrastructure/collectors/boxoffice.collector";
import { GeminiClassifierAdapter } from "./infrastructure/adapters/gemini-classifier.adapter";
import { ClassifyContentUseCase } from "./application/use-cases/classify-content.use-case";
import { CreatePredictionDraftUseCase } from "./application/use-cases/create-prediction-draft.use-case";

let feedRepositoryInstance: SupabaseFeedRepository | null = null;

export function getFeedRepository(): SupabaseFeedRepository {
  if (!feedRepositoryInstance) {
    feedRepositoryInstance = new SupabaseFeedRepository();
  }
  return feedRepositoryInstance;
}

export function getFetchRssItemsUseCase(): FetchRssItemsUseCase {
  const repo = getFeedRepository();
  return new FetchRssItemsUseCase(repo, repo);
}

export function getFetchBillsUseCase(): FetchBillsUseCase {
  const repo = getFeedRepository();
  return new FetchBillsUseCase(repo);
}

export function getFinancialMarketCollector(): FinancialMarketCollector {
  const repo = getFeedRepository();
  return new FinancialMarketCollector(repo);
}

export function getBoxOfficeCollector(): BoxOfficeCollector {
  const repo = getFeedRepository();
  return new BoxOfficeCollector(repo);
}

export function getGeminiClassifierAdapter(): GeminiClassifierAdapter {
  return new GeminiClassifierAdapter();
}

export function getClassifyContentUseCase(): ClassifyContentUseCase {
  const repo = getFeedRepository();
  const classifier = getGeminiClassifierAdapter();
  return new ClassifyContentUseCase(repo, classifier);
}

export function getCreatePredictionDraftUseCase(): CreatePredictionDraftUseCase {
  const repo = getFeedRepository();
  const classifier = getGeminiClassifierAdapter();
  return new CreatePredictionDraftUseCase(repo, classifier);
}
