
import * as fs from 'fs';
import * as path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
        const key = line.substring(0, eqIdx).trim();
        const value = line.substring(eqIdx + 1).trim();
        process.env[key] = value;
    }
});

import { SupabaseFeedRepository } from '../src/bounded-contexts/feed/infrastructure/repositories/supabase-feed.repository';
import { ProcessStatus } from '../src/bounded-contexts/feed/domain/value-objects/feed-types';

async function run() {
    console.log("Testing Repository logic...");
    const repo = new SupabaseFeedRepository();

    // 1. Check findItemsByStatus
    console.log("Calling findItemsByStatus(CLASSIFIED)...");
    const result = await repo.findItemsByStatus(ProcessStatus.CLASSIFIED, 10);

    if (!result.success) {
        console.error("Repo Error:", result.error);
    } else {
        console.log(`Repo found ${result.data.length} items`);
        result.data.forEach(i => console.log(`- Item: ${i.title}, Status: ${i.processStatus}, AI: ${i.aiClassification}`));
    }
}

run();
