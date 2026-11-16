/**
 * Header navigation targets, shared by the desktop dropdowns (ExercisesMenu, DictionaryMenu,
 * Header) and the slide-out MobileNav so both list the same pages.
 */
export interface NavLinkItem {
  to: string;
  /** i18n key of the link label. */
  labelKey: string;
}

export interface NavGroup {
  /** i18n key of the group title. */
  titleKey: string;
  links: NavLinkItem[];
}

export const EXERCISES_NAV: NavGroup = {
  titleKey: 'nav.exercises',
  links: [
    { to: '/exercises/grammar', labelKey: 'nav.grammar' },
    { to: '/exercises/vocabulary', labelKey: 'nav.vocabulary' },
  ],
};

export const DICTIONARY_NAV: NavGroup = {
  titleKey: 'nav.dictionary',
  links: [
    { to: '/dictionary/my', labelKey: 'nav.myDictionary' },
    { to: '/dictionary/my-collections', labelKey: 'nav.collections' },
    { to: '/dictionary/recommended-word-sets', labelKey: 'nav.wordSets' },
  ],
};

export const LESSONS_LINK: NavLinkItem = { to: '/lessons', labelKey: 'nav.lessons' };
