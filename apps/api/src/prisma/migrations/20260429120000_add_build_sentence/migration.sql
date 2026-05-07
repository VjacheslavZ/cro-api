-- AlterEnum
ALTER TYPE "ExerciseType" ADD VALUE 'BUILD_SENTENCE';

-- CreateTable
CREATE TABLE "BuildSentenceItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "topicId" TEXT NOT NULL,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "BuildSentenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildSentenceWord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "itemId" TEXT NOT NULL,
    "wordHr" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "distractors" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "BuildSentenceWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuildSentenceWord_itemId_position_key" ON "BuildSentenceWord"("itemId", "position");

-- AddForeignKey
ALTER TABLE "BuildSentenceItem" ADD CONSTRAINT "BuildSentenceItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildSentenceWord" ADD CONSTRAINT "BuildSentenceWord_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BuildSentenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
