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
