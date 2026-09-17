import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TrophyIcon } from 'lucide-react';

interface ResultsSummaryProps {
  title: string;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  currentStreak: number;
  /** Action buttons rendered under the stats. */
  children: ReactNode;
}

/** Centered trophy + score / XP / streak block shared by the practice and review result pages. */
export function ResultsSummary({
  title,
  correctAnswers,
  totalQuestions,
  xpEarned,
  currentStreak,
  children,
}: ResultsSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <TrophyIcon className="mx-auto mb-4 size-16 text-xp" />
      <h1 className="mb-4 text-3xl font-semibold">{title}</h1>
      <p className="mb-2 text-2xl">
        {t('exercises.results.score', { correct: correctAnswers, total: totalQuestions })}
      </p>
      <p className="mb-2 text-lg font-medium text-primary">
        {t('exercises.results.xpEarned', { xp: xpEarned })}
      </p>
      <p className="mb-8 text-muted-foreground">
        {t('exercises.results.streak', { count: currentStreak })}
      </p>
      <div className="flex justify-center gap-4">{children}</div>
    </div>
  );
}
