-- CreateTable
CREATE TABLE "PredefinedDictionaryWord" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "wordHr" TEXT NOT NULL,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredefinedDictionaryWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PredefinedDictionaryWord_collectionId_wordHr_key" ON "PredefinedDictionaryWord"("collectionId", "wordHr");

-- AddForeignKey
ALTER TABLE "PredefinedDictionaryWord" ADD CONSTRAINT "PredefinedDictionaryWord_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DictionaryCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
