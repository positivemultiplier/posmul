-- Create feed schema
CREATE SCHEMA IF NOT EXISTS feed;

-- RSS Sources table
CREATE TABLE IF NOT EXISTS feed.rss_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed Items table
CREATE TABLE IF NOT EXISTS feed.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES feed.rss_sources(id),
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    content_summary TEXT, -- AI 요약 내용 등
    published_at TIMESTAMPTZ,
    ai_classification TEXT CHECK (ai_classification IN ('PREDICTION', 'FORUM', 'UNCLASSIFIED', 'DISCARD')),
    process_status TEXT DEFAULT 'PENDING' CHECK (process_status IN ('PENDING', 'DRAFT_CREATED', 'PUBLISHED', 'IGNORED', 'ERROR')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills table (Open Assembly API)
CREATE TABLE IF NOT EXISTS feed.bills (
    bill_id TEXT PRIMARY KEY, -- API에서 제공하는 고유 ID
    bill_no TEXT NOT NULL, -- 의안번호
    bill_name TEXT NOT NULL,
    proposer TEXT,
    committee TEXT,
    proc_result TEXT, -- 처리결과
    rgs_conf_rslt TEXT, -- 본회의 심의결과
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE feed.rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed.bills ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access for authenticated users' AND tablename = 'rss_sources' AND schemaname = 'feed') THEN
        CREATE POLICY "Allow read access for authenticated users" ON feed.rss_sources FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access for authenticated users' AND tablename = 'items' AND schemaname = 'feed') THEN
        CREATE POLICY "Allow read access for authenticated users" ON feed.items FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access for authenticated users' AND tablename = 'bills' AND schemaname = 'feed') THEN
        CREATE POLICY "Allow read access for authenticated users" ON feed.bills FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
