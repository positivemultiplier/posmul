-- Migration: Add slug column to prediction_games table
-- Version: 002
-- Description: Adds SEO-friendly slug column for Polymarket-style URLs

-- Step 1: Add slug column (nullable initially)
ALTER TABLE prediction.prediction_games 
ADD COLUMN IF NOT EXISTS slug text;

-- Step 2: Create slug generation function
CREATE OR REPLACE FUNCTION prediction.generate_slug(title text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Convert title to lowercase, replace non-alphanumeric with hyphens
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Remove leading/trailing hyphens
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Truncate to 100 characters
  base_slug := SUBSTRING(base_slug, 1, 100);
  
  -- Check uniqueness and append counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM prediction.prediction_games WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Generate slugs for existing records
UPDATE prediction.prediction_games
SET slug = prediction.generate_slug(title)
WHERE slug IS NULL;

-- Step 4: Make slug NOT NULL
ALTER TABLE prediction.prediction_games 
ALTER COLUMN slug SET NOT NULL;

-- Step 5: Add unique constraint
ALTER TABLE prediction.prediction_games 
ADD CONSTRAINT prediction_games_slug_unique UNIQUE (slug);

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_prediction_games_slug 
ON prediction.prediction_games(slug);

-- Step 7: Create trigger for auto-generation on INSERT
CREATE OR REPLACE FUNCTION prediction.auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := prediction.generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON prediction.prediction_games;
CREATE TRIGGER trigger_auto_generate_slug
BEFORE INSERT ON prediction.prediction_games
FOR EACH ROW
EXECUTE FUNCTION prediction.auto_generate_slug();

-- Verify migration
DO $$
DECLARE
  slug_count int;
  null_slug_count int;
BEGIN
  SELECT COUNT(*) INTO slug_count FROM prediction.prediction_games WHERE slug IS NOT NULL;
  SELECT COUNT(*) INTO null_slug_count FROM prediction.prediction_games WHERE slug IS NULL;
  
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Total games with slugs: %', slug_count;
  RAISE NOTICE '  - Games with NULL slugs: %', null_slug_count;
END $$;
