import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from 'cn';

import { buttonVariants } from '@/components/ui/button';
import { useAppSelector } from '@/store';

import { LanguageMenu } from './header/LanguageMenu';
import { ThemeMenu } from './header/ThemeMenu';
import { DictionaryMenu } from './header/DictionaryMenu';
import { ExercisesMenu } from './header/ExercisesMenu';
import { MobileNav } from './header/MobileNav';
import { LESSONS_LINK } from './header/navLinks';
import { StatPills } from './header/StatPills';
import { UserMenu } from './header/UserMenu';

/**
 * Sticky app header. From the `nav` breakpoint (850px) up it shows the full navigation; below it
 * the navigation moves into MobileNav (burger + slide-out menu), and below `sm` the XP / streak
 * pills move there too.
 */
export function Header() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const xp = user?.xpTotal ?? 0;
  const streak = user?.currentStreak ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-1">
          {user && <MobileNav xp={xp} streak={streak} />}
          <Link
            to="/"
            className="text-lg font-bold text-primary transition-colors hover:text-primary/80 nav:w-[212px]"
          >
            CroGrammar
          </Link>
        </div>

        {user ? (
          <>
            <nav className="hidden items-center gap-1 nav:flex">
              <ExercisesMenu />
              <DictionaryMenu />
              <Link to={LESSONS_LINK.to} className={cn(buttonVariants({ variant: 'ghost' }))}>
                {t(LESSONS_LINK.labelKey)}
              </Link>
            </nav>

            <div className="flex items-center">
              <StatPills xp={xp} streak={streak} className="hidden sm:flex" />
              <UserMenu />
            </div>
          </>
        ) : (
          <div className="flex items-center">
            <ThemeMenu />
            <LanguageMenu />
          </div>
        )}
      </div>
    </header>
  );
}
