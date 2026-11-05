-- Brings the migration history in line with schema.prisma.
-- The better-auth tables and User.emailVerified were added to local databases
-- outside of migrations, so a database built only from migrations lacked them.
--
-- A database that already has these objects must not run this file. Mark it
-- applied instead: prisma migrate resolve --applied 20261105000000_align_migrations_with_schema

-- AlterTable
ALTER TABLE "BuildSentenceWord" ALTER COLUMN "distractors" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DistractorSet" ALTER COLUMN "words" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "titleHr" DROP DEFAULT,
ALTER COLUMN "titleRu" DROP DEFAULT,
ALTER COLUMN "titleUk" DROP DEFAULT,
ALTER COLUMN "titleEn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PredefinedDictionaryWord" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TypeTheAnswerItem" RENAME CONSTRAINT "SingularPluralItem_pkey" TO "TypeTheAnswerItem_pkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- RenameForeignKey
ALTER TABLE "TypeTheAnswerItem" RENAME CONSTRAINT "SingularPluralItem_topicId_fkey" TO "TypeTheAnswerItem_topicId_fkey";

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "SingularPluralItem_baseForm_key" RENAME TO "TypeTheAnswerItem_baseForm_key";
