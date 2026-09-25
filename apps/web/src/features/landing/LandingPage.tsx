import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlameIcon, StarIcon } from 'lucide-react';
import { cn } from 'cn';

import { PageContainer } from '@/components/PageContainer';
import { buttonVariants } from '@/components/ui/button';

import { HeroDrill } from './HeroDrill';
import { ReviewTimeline } from './ReviewTimeline';
import { ModeList } from './ModeList';
import { GRAMMAR_MODES, WORD_MODES } from './modeSpecimens';

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="landing">
      {/* Hero */}
      <PageContainer className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col justify-center gap-6 lg:col-span-5">
          <h1 className="font-display text-5xl leading-[1.02] font-medium tracking-tight text-balance display-hero sm:text-6xl">
            {t('landing.hero.title')}
          </h1>
          <p className="max-w-[46ch] text-lg text-muted-foreground">{t('landing.hero.lead')}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link to="/login" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5 text-base')}>
              {t('landing.cta.startFree')}
            </Link>
            <span className="text-sm text-muted-foreground">{t('landing.cta.noCard')}</span>
          </div>
        </div>
        <div className="lg:col-span-7">
          <HeroDrill />
        </div>
      </PageContainer>

      {/* In your language */}
      <section className="border-t bg-muted/40">
        <PageContainer className="grid gap-8 py-14 sm:py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl leading-tight font-medium text-balance sm:text-4xl">
              {t('landing.language.title')}
            </h2>
            <p className="mt-4 max-w-[52ch] text-muted-foreground">{t('landing.language.body')}</p>
          </div>
          <dl className="grid grid-cols-3 gap-x-6 self-center lg:col-span-7 lg:grid-cols-[auto_1fr_1fr_1fr] lg:gap-x-10">
            <dt lang="hr" className="col-span-3 mb-2 font-display text-4xl lg:col-span-1 lg:mb-0">
              grad
            </dt>
            {(['ru', 'uk', 'en'] as const).map((lng) => (
              <dd key={lng} className="border-t pt-2">
                <span className="block text-sm text-muted-foreground">
                  {t(`landing.language.${lng}`)}
                </span>
                <span className="block text-lg" lang={lng}>
                  {t(`landing.language.word.${lng}`)}
                </span>
              </dd>
            ))}
          </dl>
        </PageContainer>
      </section>

      {/* Practice modes */}
      <section className="border-t">
        <PageContainer className="py-14 sm:py-16">
          <h2 className="font-display text-3xl leading-tight font-medium text-balance sm:text-4xl">
            {t('landing.modes.title')}
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">{t('landing.modes.body')}</p>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <ModeList heading={t('landing.modes.grammar')} modes={GRAMMAR_MODES} />
            <ModeList heading={t('landing.modes.words')} modes={WORD_MODES} />
          </div>
        </PageContainer>
      </section>

      {/* Revision */}
      <section className="border-t bg-muted/40">
        <PageContainer className="grid gap-8 py-14 sm:py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl leading-tight font-medium text-balance sm:text-4xl">
              {t('landing.revision.title')}
            </h2>
            <p className="mt-4 max-w-[52ch] text-muted-foreground">{t('landing.revision.body')}</p>
          </div>
          <div className="flex flex-col gap-6 self-center lg:col-span-7">
            <ReviewTimeline />
            <div className="flex flex-wrap gap-2">
              {(['again', 'hard', 'good', 'easy'] as const).map((r) => (
                <span key={r} className="rounded-full border bg-background px-3 py-1 text-sm">
                  {t(`landing.revision.rating.${r}`)}
                </span>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Progress — one sentence, the two pills the app header shows */}
      <section className="border-t">
        <PageContainer className="flex flex-col gap-5 py-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[60ch] text-lg">{t('landing.progress.body')}</p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-xp-border bg-xp-muted px-3 py-1.5 text-sm font-medium text-xp-foreground">
              <StarIcon className="size-4 text-xp" />
              {t('landing.progress.xp')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-streak-border bg-streak-muted px-3 py-1.5 text-sm font-medium text-streak-foreground">
              <FlameIcon className="size-4 text-streak" />
              {t('landing.progress.streak')}
            </span>
          </div>
        </PageContainer>
      </section>

      {/* Pricing */}
      <section className="border-t bg-muted/40">
        <PageContainer size="md" className="py-16 text-center sm:py-20">
          <h2 className="font-display text-4xl leading-tight font-medium text-balance sm:text-5xl">
            {t('landing.pricing.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-[50ch] text-muted-foreground">
            {t('landing.pricing.body')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/login" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5 text-base')}>
              {t('landing.cta.startFree')}
            </Link>
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-11 px-4')}
            >
              {t('landing.cta.login')}
            </Link>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
