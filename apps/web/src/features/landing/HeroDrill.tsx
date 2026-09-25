import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from 'cn';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { CaseStrip } from './CaseStrip';
import { DRILL_ITEMS, normalizeAnswer, type CaseKey } from './drillItems';

const XP_PER_ANSWER = 10;

type Status = 'idle' | 'correct' | 'wrong' | 'finished';

/**
 * A playable fill-in-the-blank drill for guests: six real items, one per oblique
 * case, checked in the browser exactly the way the app checks them.
 */
export function HeroDrill() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [done, setDone] = useState<ReadonlySet<CaseKey>>(() => new Set());
  const [xp, setXp] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = DRILL_ITEMS[index];
  const answered = status === 'correct' || status === 'wrong';
  const [before, after] = item.sentenceHr.split('___');

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (answered || !value.trim()) return;
    if (normalizeAnswer(value) === normalizeAnswer(item.answer)) {
      setStatus('correct');
      setDone((prev) => new Set(prev).add(item.caseKey));
      setXp((prev) => prev + XP_PER_ANSWER);
    } else {
      setStatus('wrong');
    }
  };

  const next = () => {
    if (index + 1 >= DRILL_ITEMS.length) {
      setStatus('finished');
      return;
    }
    setIndex(index + 1);
    setValue('');
    setStatus('idle');
    // Keep the keyboard flow: the visitor should be able to keep typing.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (status === 'finished') {
    return (
      <section
        aria-label={t('landing.drill.title')}
        className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:p-8"
      >
        <p className="font-display text-2xl leading-snug text-balance sm:text-3xl">
          {t('landing.drill.finished', { count: done.size, xp })}
        </p>
        <CaseStrip done={done} active={null} />
        <Link to="/login" className={cn(buttonVariants({ size: 'lg' }), 'self-start px-5')}>
          {t('landing.cta.startFree')}
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label={t('landing.drill.title')}
      className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-4 text-sm text-muted-foreground">
        <span>
          {t(`landing.cases.${item.caseKey}`)} · {t('landing.drill.singular')}
        </span>
        <span aria-live="polite">
          {index + 1} / {DRILL_ITEMS.length}
        </span>
      </div>

      <form onSubmit={check} className="flex flex-col gap-4">
        <label
          htmlFor="hero-drill-input"
          className="font-display text-3xl leading-tight sm:text-4xl"
        >
          <span lang="hr">{before}</span>
          <span
            aria-hidden="true"
            className={cn(
              'ml-1 inline-block border-b-2 border-foreground/70 align-baseline',
              !answered && 'min-w-[4ch]',
              status === 'correct' && 'border-success',
              status === 'wrong' && 'border-destructive',
            )}
          >
            {answered ? <span lang="hr">{item.answer}</span> : ' '}
          </span>
          <span lang="hr">{after}</span>
          <span className="ml-3 font-sans text-base text-muted-foreground">({item.baseForm})</span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            ref={inputRef}
            id="hero-drill-input"
            lang="hr"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            readOnly={answered}
            aria-invalid={status === 'wrong' || undefined}
            aria-describedby="hero-drill-feedback"
            placeholder={t('landing.drill.placeholder')}
            className="h-11 text-base sm:max-w-xs"
          />
          {answered ? (
            <Button type="button" size="lg" className="h-11 px-5" onClick={next}>
              {index + 1 >= DRILL_ITEMS.length
                ? t('landing.drill.finish')
                : t('landing.drill.next')}
            </Button>
          ) : (
            <Button type="submit" size="lg" className="h-11 px-5" disabled={!value.trim()}>
              {t('landing.drill.check')}
            </Button>
          )}
        </div>

        <p
          id="hero-drill-feedback"
          role="status"
          className={cn(
            'min-h-6 text-sm',
            status === 'correct' && 'text-success-muted-foreground',
            status === 'wrong' && 'text-destructive-muted-foreground',
          )}
        >
          {status === 'correct' && t('landing.drill.correct', { xp: XP_PER_ANSWER })}
          {status === 'wrong' && t('landing.drill.wrong', { answer: item.answer })}
        </p>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CaseStrip done={done} active={item.caseKey} />
        <span className="text-sm text-muted-foreground">{t('landing.drill.xpTotal', { xp })}</span>
      </div>
    </section>
  );
}
