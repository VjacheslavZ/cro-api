-- AlterTable
ALTER TABLE "DictionaryWordProgress" ADD COLUMN     "letterPickPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matchingPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "translateToWordPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wordToTranslatePercent" INTEGER NOT NULL DEFAULT 0;
