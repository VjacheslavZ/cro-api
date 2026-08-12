-- Add multilingual title and description columns
ALTER TABLE "Lesson"
  ADD COLUMN "titleHr" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "titleRu" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "titleUk" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "titleEn" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "descriptionHr" TEXT,
  ADD COLUMN "descriptionRu" TEXT,
  ADD COLUMN "descriptionUk" TEXT,
  ADD COLUMN "descriptionEn" TEXT;

-- Migrate existing data: copy old title/description to all language variants
UPDATE "Lesson"
SET
  "titleHr" = "title",
  "titleRu" = "title",
  "titleUk" = "title",
  "titleEn" = "title",
  "descriptionHr" = "description",
  "descriptionRu" = "description",
  "descriptionUk" = "description",
  "descriptionEn" = "description";

-- Drop old single-language columns
ALTER TABLE "Lesson"
  DROP COLUMN "title",
  DROP COLUMN "description";
