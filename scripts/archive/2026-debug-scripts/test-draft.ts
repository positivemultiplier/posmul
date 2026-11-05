
import * as fs from 'fs';
import * as path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

import { SupabaseFeedRepository } from '../src/bounded-contexts/feed/infrastructure/repositories/supabase-feed.repository';
import { GeminiClassifierAdapter } from '../src/bounded-contexts/feed/infrastructure/adapters/gemini-classifier.adapter';
import { CreatePredictionDraftUseCase } from '../src/bounded-contexts/feed/application/use-cases/create-prediction-draft.use-case';
import { ProcessStatus } from '../src/bounded-contexts/feed/domain/value-objects/feed-types';

async function run() {
    console.log("Starting Draft Test...");
    const repo = new SupabaseFeedRepository();
    const classifier = new GeminiClassifierAdapter();
    const useCase = new CreatePredictionDraftUseCase(repo, classifier);

    // Check query first
    const itemsRes = await repo.findItemsByStatus(ProcessStatus.CLASSIFIED, 5);
    if (!itemsRes.success) {
        console.error("Find Items Error:", itemsRes.error);
        return;
    }
    console.log(`Found ${itemsRes.data.length} items with status CLASSIFIED`);
    itemsRes.data.forEach(i => console.log(`- ${i.id} (${i.aiClassification})`));

    // Execute Use Case
    const result = await useCase.execute(5);
    if (!result.success) {
        console.error("UseCase Error:", result.error);
    } else {
        console.log("UseCase Success:", result.data);
    }
}

run();
