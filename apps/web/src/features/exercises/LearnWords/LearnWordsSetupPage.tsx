/**
 * @module LearnWordsSetupPage
 * @description Step 1 of the Learn Words flow. User selects word count (5/10/15/20)
 * and filter (newest/oldest/progress). On "Next", fetches the word preview via
 * useLearnWordsPreview, then navigates to LearnWordsPreviewPage once words load.
 * Supports optional collectionId from URL search params to scope the word pool.
 * @usedBy AppRouter (/exercises/vocabulary/learn)
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { useLearnWordsPreview } from '../../../api/dictionary';

const COUNT_OPTIONS = [5, 10, 15, 20];
const FILTER_OPTIONS = ['newest', 'oldest', 'progress'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

/**
 * Renders the Learn Words configuration form and initiates the word preview fetch.
 * Navigation to the preview page happens reactively once the query returns data.
 */
export function LearnWordsSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId') ?? undefined;

  const [count, setCount] = useState<number>(() => {
    const saved = localStorage.getItem('cro_learn_words_count');
    const parsed = saved ? Number(saved) : NaN;
    return COUNT_OPTIONS.includes(parsed) ? parsed : 10;
  });
  const [filter, setFilter] = useState<FilterOption>(() => {
    const saved = localStorage.getItem('cro_learn_words_filter');
    return FILTER_OPTIONS.includes(saved as FilterOption) ? (saved as FilterOption) : 'newest';
  });
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const {
    data: words,
    isLoading,
    isError,
  } = useLearnWordsPreview({ count, filter, collectionId }, fetchEnabled);

  const handleNext = () => {
    setFetchEnabled(true);
  };

  // Navigate once words are loaded
  if (words && fetchEnabled) {
    navigate('/exercises/vocabulary/learn/preview', {
      state: { words, collectionId },
    });
    return null;
  }

  const filterLabelKey: Record<FilterOption, string> = {
    newest: 'exercises.learnWords.filterNewest',
    oldest: 'exercises.learnWords.filterOldest',
    progress: 'exercises.learnWords.filterProgress',
  };

  return (
    <PageContainer size="sm" className="py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        {collectionId ? t('nav.dictionary') : t('exercises.vocabulary.title')}
      </Button>

      <h1 className="mb-2 text-3xl font-semibold">{t('exercises.learnWords.setupTitle')}</h1>

      <h2 className="mt-6 mb-2 font-semibold">{t('exercises.learnWords.wordCount')}</h2>
      <ToggleGroup
        variant="outline"
        className="flex-wrap"
        value={[String(count)]}
        onValueChange={(val) => {
          const next = Number(val[0]);
          if (COUNT_OPTIONS.includes(next)) {
            setCount(next);
            localStorage.setItem('cro_learn_words_count', String(next));
          }
        }}
      >
        {COUNT_OPTIONS.map((n) => (
          <ToggleGroupItem key={n} value={String(n)} className="min-w-14">
            {n}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <h2 className="mt-6 mb-2 font-semibold">{t('exercises.learnWords.filter')}</h2>
      <ToggleGroup
        variant="outline"
        className="flex-wrap"
        value={[filter]}
        onValueChange={(val) => {
          const next = val[0] as FilterOption | undefined;
          if (next && FILTER_OPTIONS.includes(next)) {
            setFilter(next);
            localStorage.setItem('cro_learn_words_filter', next);
          }
        }}
      >
        {FILTER_OPTIONS.map((f) => (
          <ToggleGroupItem key={f} value={f}>
            {t(filterLabelKey[f])}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {isError && <ErrorAlert className="mt-4" />}

      <div className="mt-8">
        <Button size="lg" className="w-full" onClick={handleNext} disabled={isLoading}>
          {t('exercises.learnWords.next')}
        </Button>
      </div>
    </PageContainer>
  );
}
