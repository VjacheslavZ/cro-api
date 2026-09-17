import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { XIcon, YouTubeIcon, FacebookIcon, GooglePlayIcon, AppStoreIcon } from '@/assets/icons';

import { PageContainer } from './PageContainer';

const socialLinks = [
  { href: 'https://x.com', icon: <XIcon />, label: 'X / Twitter' },
  { href: 'https://youtube.com', icon: <YouTubeIcon />, label: 'YouTube' },
  { href: 'https://facebook.com', icon: <FacebookIcon />, label: 'Facebook' },
];

const appLinks = [
  { href: '#', icon: <GooglePlayIcon />, label: 'Google Play' },
  { href: '#', icon: <AppStoreIcon />, label: 'App Store' },
];

const iconLinkClass =
  'flex size-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 [&_svg]:size-5';

function IconLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={iconLinkClass}
    >
      {icon}
    </a>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const companyLinks = [
    { label: t('footer.aboutUs'), to: '/about' },
    { label: t('footer.forPartners'), to: '/partners' },
    { label: t('footer.contacts'), to: '/contacts' },
  ];

  return (
    <footer className="mt-auto bg-neutral-900 text-neutral-300">
      <PageContainer size="lg" className="py-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Branding */}
          <div className="col-span-2">
            <p className="mb-3 text-lg font-bold text-white">CroGrammar</p>
            <p className="text-sm leading-relaxed text-neutral-400">{t('footer.tagline')}</p>
          </div>

          {/* Company links */}
          <div>
            <p className="mb-4 text-sm font-semibold text-white">{t('footer.company')}</p>
            <div className="flex flex-col gap-2">
              {companyLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-neutral-400 hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <p className="mb-4 text-sm font-semibold text-white">{t('footer.socials')}</p>
            <div className="flex gap-2">
              {socialLinks.map((s) => (
                <IconLink key={s.label} {...s} />
              ))}
            </div>
          </div>

          {/* Get the App */}
          <div className="col-span-2">
            <p className="mb-4 text-sm font-semibold text-white">{t('footer.mobileApps')}</p>
            <div className="flex gap-2">
              {appLinks.map((a) => (
                <IconLink key={a.label} {...a} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-800 pt-4 text-center">
          <p className="text-sm text-neutral-500">
            &copy; {year} CroGrammar. {t('footer.rights')}
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
