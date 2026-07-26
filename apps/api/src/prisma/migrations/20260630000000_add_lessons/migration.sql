-- CreateEnum
CREATE TYPE "LessonItemType" AS ENUM ('EXERCISE_TOPIC', 'DICTIONARY_COLLECTION');

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonItem" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "itemType" "LessonItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonItem_lessonId_idx" ON "LessonItem"("lessonId");

-- AddForeignKey
ALTER TABLE "LessonItem" ADD CONSTRAINT "LessonItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
