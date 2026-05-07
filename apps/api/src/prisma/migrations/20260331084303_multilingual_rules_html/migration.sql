/*
  Warnings:

  - You are about to drop the column `rulesHtml` on the `ExerciseTopic` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExerciseTopic" DROP COLUMN "rulesHtml",
ADD COLUMN     "rulesHtmlEn" TEXT,
ADD COLUMN     "rulesHtmlHr" TEXT,
ADD COLUMN     "rulesHtmlRu" TEXT,
ADD COLUMN     "rulesHtmlUk" TEXT;
