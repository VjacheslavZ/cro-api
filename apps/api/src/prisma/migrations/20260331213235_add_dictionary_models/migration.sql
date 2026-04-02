-- CreateTable
CREATE TABLE "DictionaryCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdByAdminId" TEXT,
    "createdByUserId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DictionaryCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDictionaryWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordHr" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "translationLanguage" "NativeLanguage" NOT NULL,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDictionaryWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictionaryWordProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),

    CONSTRAINT "DictionaryWordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictionaryPracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DictionaryPracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictionaryPracticeAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "givenAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "DictionaryPracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDictionaryWord_wordHr_translationLanguage_idx" ON "UserDictionaryWord"("wordHr", "translationLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "UserDictionaryWord_userId_wordHr_key" ON "UserDictionaryWord"("userId", "wordHr");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryWordProgress_wordId_key" ON "DictionaryWordProgress"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryWordProgress_userId_wordId_key" ON "DictionaryWordProgress"("userId", "wordId");

-- AddForeignKey
ALTER TABLE "DictionaryCollection" ADD CONSTRAINT "DictionaryCollection_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryCollection" ADD CONSTRAINT "DictionaryCollection_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDictionaryWord" ADD CONSTRAINT "UserDictionaryWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDictionaryWord" ADD CONSTRAINT "UserDictionaryWord_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DictionaryCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryWordProgress" ADD CONSTRAINT "DictionaryWordProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryWordProgress" ADD CONSTRAINT "DictionaryWordProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "UserDictionaryWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryPracticeSession" ADD CONSTRAINT "DictionaryPracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryPracticeAnswer" ADD CONSTRAINT "DictionaryPracticeAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DictionaryPracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
