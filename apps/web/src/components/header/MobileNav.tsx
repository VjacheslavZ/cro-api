import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MenuIcon } from 'lucide-react';
import { cn } from 'cn';

import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { DICTIONARY_NAV, EXERCISES_NAV, LESSONS_LINK, type NavLinkItem } from './navLinks';
import { StatPills } from './StatPills';

/** Same width as the `nav` breakpoint in globals.css. */
const DESKTOP_NAV_QUERY = '(min-width: 850px)';

interface MobileNavProps {
  xp: number;
  streak: number;
}

/**
 * Burger button + left slide-out menu that replaces the header navigation below the `nav`
 * breakpoint (850px). Closes on link click, and when the window grows past the breakpoint (the
 * trigger is hidden there, so an open sheet could not be closed from the header).
 */
export function MobileNav({ xp, streak }: MobileNavProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(DESKTOP_NAV_QUERY);
    const closeOnDesktop = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    query.addEventListener('change', closeOnDesktop);
    return () => query.removeEventListener('change', closeOnDesktop);
  }, []);

  const renderLink = ({ to, labelKey }: NavLinkItem) => (
    <NavLink
      key={to}
      to={to}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full justify-start',
          isActive && 'bg-muted text-foreground',
        )
      }
    >
      {t(labelKey)}
    </NavLink>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="nav:hidden" />}
        aria-label={t('header.openMenu')}
      >
        <MenuIcon />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 gap-2">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-primary">CroGrammar</SheetTitle>
        </SheetHeader>

        <StatPills xp={xp} streak={streak} className="px-3 sm:hidden" />

        <nav className="flex flex-col gap-4 overflow-y-auto px-2 pb-4">
          {[EXERCISES_NAV, DICTIONARY_NAV].map((group) => (
            <section key={group.titleKey} className="flex flex-col gap-0.5">
              <h2 className="px-2.5 pb-1 text-xs font-medium text-muted-foreground uppercase">
                {t(group.titleKey)}
              </h2>
              {group.links.map(renderLink)}
            </section>
          ))}
          {renderLink(LESSONS_LINK)}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
