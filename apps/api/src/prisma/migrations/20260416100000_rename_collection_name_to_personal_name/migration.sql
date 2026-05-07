-- AlterTable
ALTER TABLE "DictionaryCollection" RENAME COLUMN "name" TO "personalName";

-- Update default (was NOT NULL without default, now give it one)
ALTER TABLE "DictionaryCollection" ALTER COLUMN "personalName" SET DEFAULT '';
