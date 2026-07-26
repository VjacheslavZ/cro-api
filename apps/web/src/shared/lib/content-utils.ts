interface LocalizedItem {
  nameHr: string;
  nameRu: string;
  nameUk: string;
  nameEn: string;
}

export function getLocalizedName(item: LocalizedItem, lang: string | null): string {
  switch (lang) {
    case 'RU':
      return item.nameRu;
    case 'UK':
      return item.nameUk;
    default:
      return item.nameEn;
  }
}

interface TranslatableItem {
  translationRu: string;
  translationUk: string;
  translationEn: string;
}

export function getTranslation(item: TranslatableItem, lang: string | null): string {
  switch (lang) {
    case 'RU':
      return item.translationRu;
    case 'UK':
      return item.translationUk;
    default:
      return item.translationEn;
  }
}

interface RulesItem {
  rulesHtmlHr: string | null;
  rulesHtmlRu: string | null;
  rulesHtmlUk: string | null;
  rulesHtmlEn: string | null;
}

export function getRulesHtml(item: RulesItem, lang: string | null): string | null {
  switch (lang) {
    case 'RU':
      return item.rulesHtmlRu ?? item.rulesHtmlHr ?? null;
    case 'UK':
      return item.rulesHtmlUk ?? item.rulesHtmlHr ?? null;
    default:
      return item.rulesHtmlEn ?? item.rulesHtmlHr ?? null;
  }
}

export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().normalize('NFC');
}

interface LessonLike {
  titleHr: string;
  titleRu: string;
  titleUk: string;
  titleEn: string;
  descriptionHr: string | null;
  descriptionRu: string | null;
  descriptionUk: string | null;
  descriptionEn: string | null;
}

export function getLessonTitle(lesson: LessonLike, lang: string | null): string {
  switch (lang) {
    case 'RU':
      return lesson.titleRu || lesson.titleEn;
    case 'UK':
      return lesson.titleUk || lesson.titleEn;
    default:
      return lesson.titleEn || lesson.titleHr;
  }
}

export function getLessonDescription(lesson: LessonLike, lang: string | null): string | null {
  switch (lang) {
    case 'RU':
      return lesson.descriptionRu ?? lesson.descriptionEn;
    case 'UK':
      return lesson.descriptionUk ?? lesson.descriptionEn;
    default:
      return lesson.descriptionEn ?? lesson.descriptionHr;
  }
}
