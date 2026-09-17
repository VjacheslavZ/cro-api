import { Link } from 'react-router-dom';
import { FlameIcon, StarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from 'cn';

import { buttonVariants } from '@/components/ui/button';

import { useAppSelector } from '../store';
import { LanguageMenu } from './header/LanguageMenu';
import { DictionaryMenu } from './header/DictionaryMenu';
import { ExercisesMenu } from './header/ExercisesMenu';
import { UserMenu } from './header/UserMenu';

export function Header() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="w-[212px] text-lg font-bold text-primary transition-colors hover:text-primary/80"
        >
          CroGrammar
        </Link>

        {isAuthenticated ? (
          <>
            <nav className="flex items-center gap-1">
              <ExercisesMenu />
              <DictionaryMenu />
              <Link to="/lessons" className={cn(buttonVariants({ variant: 'ghost' }))}>
                {t('nav.lessons')}
              </Link>
            </nav>

            <div className="flex items-center">
              {/* XP pill */}
              <span className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-xp-border bg-xp-muted px-3 py-1.5 text-sm font-medium text-xp-foreground">
                <StarIcon className="size-4 text-xp" />
                {user?.xpTotal ?? 0}
              </span>

              {/* Streak pill */}
              <span className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-streak-border bg-streak-muted px-3 py-1.5 text-sm font-medium text-streak-foreground">
                <FlameIcon className="size-4 text-streak" />
                {user?.currentStreak ?? 0}
              </span>

              <UserMenu />
            </div>
          </>
        ) : (
          <LanguageMenu />
        )}
      </div>
    </header>
  );
}
