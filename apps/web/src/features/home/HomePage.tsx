import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpenIcon, FlameIcon, LibraryIcon, StarIcon } from 'lucide-react';
import { cn } from 'cn';

import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';

import { useAppSelector } from '../../store';
import { useTopics } from '../../api/content';
import { useDictionaryLearnedWordCount, useDictionaryReviewDueCount } from '../../api/dictionary';
import { useLaunchDictionaryReview } from '../../shared/hooks/useLaunchDictionaryReview.ts';

export function HomePage() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { data: topics } = useTopics();
  const { data: wordCount } = useDictionaryLearnedWordCount();
  const { data: reviewDueCount } = useDictionaryReviewDueCount();
  const { launch: launchReview, loading: reviewLoading } = useLaunchDictionaryReview('/');

  const stats = [
    {
      icon: <BookOpenIcon />,
      toneClass: 'bg-blue-100 text-primary',
      value: topics?.length ?? '—',
      label: t('home.statsGrammarTopics'),
    },
    {
      icon: <LibraryIcon />,
      toneClass: 'bg-violet-100 text-violet-600',
      value: wordCount ?? 0,
      label: t('home.statsWordsLearned'),
    },
    {
      icon: <FlameIcon />,
      toneClass: 'bg-streak-muted text-streak',
      value: user?.currentStreak ?? 0,
      label: t('home.statsDayStreak'),
    },
    {
      icon: <StarIcon />,
      toneClass: 'bg-xp-muted text-xp',
      value: user?.xpTotal ?? 0,
      label: t('home.statsTotalXp'),
    },
  ];

  const actions: {
    title: string;
    description: string;
    btnLabel: string;
    href?: string;
    onClick?: () => void;
    variant: 'default' | 'outline';
    badge?: number;
    loading?: boolean;
  }[] = [
    {
      title: t('home.practiceGrammarTitle'),
      description: t('home.practiceGrammarDesc'),
      btnLabel: t('home.practiceGrammarBtn'),
      href: '/exercises/grammar',
      variant: 'default',
    },
    {
      title: t('home.buildVocabTitle'),
      description: t('home.buildVocabDesc'),
      btnLabel: t('home.buildVocabBtn'),
      href: '/dictionary/my',
      variant: 'outline',
    },
    {
      title: t('home.wordSetsTitle'),
      description: t('home.wordSetsDesc'),
      btnLabel: t('home.wordSetsBtn'),
      href: '/dictionary/recommended-word-sets',
      variant: 'outline',
    },
    {
      title: t('home.revisionTitle'),
      description: t('home.revisionDesc'),
      btnLabel: t('home.revisionBtn'),
      onClick: launchReview,
      variant: 'outline',
      badge: reviewDueCount,
      loading: reviewLoading,
    },
  ];

  return (
    <PageContainer size="lg" className="py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">{t('home.title')}</h1>
        <p className="mx-auto max-w-[600px] text-lg leading-relaxed text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border bg-card p-6">
            <div
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-full [&_svg]:size-6',
                stat.toneClass,
              )}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl leading-tight font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className="mx-auto grid max-w-[960px] grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {actions.map((action) => (
          <div
            key={action.title}
            className="flex h-full flex-col rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{action.title}</h2>
              {!!action.badge && (
                <Badge className="bg-teal-600 font-bold text-white">{action.badge}</Badge>
              )}
            </div>
            <p className="mb-6 flex-1 text-sm text-muted-foreground">{action.description}</p>
            {action.onClick ? (
              <Button
                onClick={action.onClick}
                variant={action.variant}
                size="lg"
                className="w-full"
                disabled={action.loading}
              >
                {action.btnLabel}
              </Button>
            ) : (
              <Link
                to={action.href!}
                className={cn(buttonVariants({ variant: action.variant, size: 'lg' }), 'w-full')}
              >
                {action.btnLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
