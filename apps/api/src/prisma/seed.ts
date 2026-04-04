import { PrismaClient, ExerciseType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function seedAdmin() {
  const email = 'test@gmail.com';
  const password = 'zxcv1234';

  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin "${email}" already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.admin.create({
    data: { email, passwordHash },
  });

  console.log(`Default admin created: ${email}`);
}

async function seedContent() {
  // --- Exercise Topics ---
  const topicsData = [
    {
      nameHr: 'Jednina i množina',
      nameRu: 'Единственное и множественное число',
      nameUk: 'Однина та множина',
      nameEn: 'Singular and plural',
      sortOrder: 0,
    },
    {
      nameHr: 'Hrana',
      nameRu: 'Еда',
      nameUk: 'Їжа',
      nameEn: 'Food',
      sortOrder: 1,
    },
    {
      nameHr: 'Životinje',
      nameRu: 'Животные',
      nameUk: 'Тварини',
      nameEn: 'Animals',
      sortOrder: 2,
    },
    {
      nameHr: 'Boje',
      nameRu: 'Цвета',
      nameUk: 'Кольори',
      nameEn: 'Colors',
      sortOrder: 3,
    },
    {
      nameHr: 'Veličine',
      nameRu: 'Размеры',
      nameUk: 'Розміри',
      nameEn: 'Sizes',
      sortOrder: 4,
    },
    {
      nameHr: 'Svakodnevne radnje',
      nameRu: 'Повседневные действия',
      nameUk: 'Щоденні дії',
      nameEn: 'Daily actions',
      sortOrder: 5,
    },
    {
      nameHr: 'Kretanje',
      nameRu: 'Движение',
      nameUk: 'Рух',
      nameEn: 'Movement',
      sortOrder: 6,
    },
  ];

  const topicRecords: Record<string, { id: string }> = {};
  for (const t of topicsData) {
    const existing = await prisma.exerciseTopic.findFirst({
      where: { nameEn: t.nameEn },
    });

    const record = existing
      ? await prisma.exerciseTopic.update({ where: { id: existing.id }, data: t })
      : await prisma.exerciseTopic.create({ data: t });

    topicRecords[t.nameEn] = record;
  }

  console.log(`Seeded ${Object.keys(topicRecords).length} topics`);

  // --- Singular Plural Items (Food & Animals) ---
  const singularPluralData = [
    // Food
    {
      topic: 'Food',
      baseForm: 'kruh',
      pluralForm: 'kruhovi',
      translationRu: 'хлеб',
      translationUk: 'хліб',
      translationEn: 'bread',
      sortOrder: 1,
    },
    // Animals
    {
      topic: 'Animals',
      baseForm: 'pas',
      pluralForm: 'psi',
      translationRu: 'собака',
      translationUk: 'собака',
      translationEn: 'dog',
      sortOrder: 1,
    },
  ];

  for (const item of singularPluralData) {
    const topicId = topicRecords[item.topic].id;
    const existing = await prisma.singularPluralItem.findFirst({
      where: { topicId, baseForm: item.baseForm },
    });
    if (!existing) {
      await prisma.singularPluralItem.create({
        data: {
          topicId,
          baseForm: item.baseForm,
          pluralForm: item.pluralForm,
          translationRu: item.translationRu,
          translationUk: item.translationUk,
          translationEn: item.translationEn,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  console.log(`Seeded ${singularPluralData.length} singular/plural items`);

  // --- Flashcard Items (all topics) ---
  const flashcardData = [
    // Food
    {
      topic: 'Food',
      frontText: 'kruh',
      translationRu: 'хлеб',
      translationUk: 'хліб',
      translationEn: 'bread',
      sortOrder: 1,
    },
    // Animals
    {
      topic: 'Animals',
      frontText: 'pas',
      translationRu: 'собака',
      translationUk: 'собака',
      translationEn: 'dog',
      sortOrder: 1,
    },
    // Colors
    {
      topic: 'Colors',
      frontText: 'crven',
      translationRu: 'красный',
      translationUk: 'червоний',
      translationEn: 'red',
      sortOrder: 1,
    },
    // Sizes
    {
      topic: 'Sizes',
      frontText: 'velik',
      translationRu: 'большой',
      translationUk: 'великий',
      translationEn: 'big',
      sortOrder: 1,
    },
    // Daily actions
    {
      topic: 'Daily actions',
      frontText: 'jesti',
      translationRu: 'есть',
      translationUk: 'їсти',
      translationEn: 'to eat',
      sortOrder: 1,
    },
    // Movement
    {
      topic: 'Movement',
      frontText: 'ići',
      translationRu: 'идти',
      translationUk: 'йти',
      translationEn: 'to go',
      sortOrder: 1,
    },
  ];

  for (const item of flashcardData) {
    const topicId = topicRecords[item.topic].id;
    const existing = await prisma.flashcardItem.findFirst({
      where: { topicId, frontText: item.frontText },
    });
    if (!existing) {
      await prisma.flashcardItem.create({
        data: {
          topicId,
          frontText: item.frontText,
          translationRu: item.translationRu,
          translationUk: item.translationUk,
          translationEn: item.translationEn,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  console.log(`Seeded ${flashcardData.length} flashcard items`);

  // --- Fill In Blank Items (sample) ---
  const fillInBlankData = [
    {
      topic: 'Food',
      sentenceHr: 'Ja jedem {{BLANK}} za doručak.',
      blankAnswer: 'kruh',
      translationRu: 'Я ем {{BLANK}} на завтрак.',
      translationUk: 'Я їм {{BLANK}} на сніданок.',
      translationEn: 'I eat {{BLANK}} for breakfast.',
      sortOrder: 1,
    },
  ];

  for (const item of fillInBlankData) {
    const topicId = topicRecords[item.topic].id;
    const existing = await prisma.fillInBlankItem.findFirst({
      where: { topicId, sentenceHr: item.sentenceHr },
    });
    if (!existing) {
      await prisma.fillInBlankItem.create({
        data: {
          topicId,
          sentenceHr: item.sentenceHr,
          blankAnswer: item.blankAnswer,
          translationRu: item.translationRu,
          translationUk: item.translationUk,
          translationEn: item.translationEn,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  console.log(`Seeded ${fillInBlankData.length} fill-in-blank items`);

  // --- Topic Types (link topics to their exercise types) ---
  const topicTypesData = [
    { topic: 'Food', types: ['TYPE_THE_ANSWER', 'FLASHCARDS', 'FILL_IN_BLANK'] },
    { topic: 'Animals', types: ['TYPE_THE_ANSWER', 'FLASHCARDS', 'FILL_IN_BLANK'] },
    { topic: 'Colors', types: ['FLASHCARDS'] },
    { topic: 'Sizes', types: ['FLASHCARDS'] },
    { topic: 'Daily actions', types: ['FLASHCARDS'] },
    { topic: 'Movement', types: ['FLASHCARDS'] },
  ];

  for (const tt of topicTypesData) {
    const topicId = topicRecords[tt.topic].id;
    for (const exerciseType of tt.types) {
      await prisma.exerciseTopicType.createMany({
        data: [{ topicId, exerciseType: exerciseType as ExerciseType }],
        skipDuplicates: true,
      });
    }
  }

  console.log('Seeded topic exercise types');
}

async function main() {
  await seedAdmin();
  await seedContent();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
