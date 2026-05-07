ALTER TABLE "UserDictionaryWord" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "UserDictionaryWord" ALTER COLUMN "updatedAt" SET DEFAULT now();
