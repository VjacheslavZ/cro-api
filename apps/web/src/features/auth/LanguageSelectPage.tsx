import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from 'cn';

import { Spinner } from '@/components/Spinner';
import { ThemeToggleGroup } from '@/components/ThemeToggleGroup';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/auth.slice.ts';
import { apiClient } from '@/api/client.ts';

import i18n from '../../i18n';
import { AuthLayout } from './AuthLayout';

type LanguageCode = 'RU' | 'UK' | 'EN';

const languages: { code: LanguageCode; nativeName: string; name: string; flag: string }[] = [
  { code: 'UK', nativeName: 'Українська', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'EN', nativeName: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'RU', nativeName: 'Русский', name: 'Russian', flag: '🇷🇺' },
];

export function LanguageSelectPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (code: LanguageCode) => {
    if (loading) return;
    setSelectedLanguage(code);
    setLoading(true);
    try {
      const { data } = await apiClient.patch('/users/me', { nativeLanguage: code });
      dispatch(setUser(data));
      i18n.changeLanguage(code.toLowerCase());
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to set language:', error);
      setLoading(false);
      setSelectedLanguage(null);
    }
  };

  return (
    <AuthLayout title={t('auth.selectLanguage')} subtitle={t('auth.languageSubtitle')}>
      <div className="grid w-full max-w-[680px] grid-cols-1 gap-4 sm:grid-cols-3">
        {languages.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          const isDisabled = loading && !isSelected;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              disabled={loading}
              aria-pressed={isSelected}
              className={cn(
                'rounded-xl border bg-card p-8 text-center transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                'enabled:hover:scale-[1.03] enabled:hover:border-info enabled:hover:shadow-lg',
                isSelected && 'border-2 border-primary bg-info-muted enabled:hover:border-primary',
                isDisabled && 'opacity-50',
                loading && 'cursor-default',
              )}
            >
              <div className="mb-3 text-[52px] leading-none">{lang.flag}</div>
              <div className="mb-1 font-semibold text-foreground">{lang.nativeName}</div>
              <div className="text-sm text-muted-foreground">{lang.name}</div>
              {isSelected && loading && (
                <div className="mt-4 flex justify-center">
                  <Spinner className="size-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground/70">{t('auth.changeLanguageLater')}</p>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">{t('auth.themeHint')}</p>
        <ThemeToggleGroup />
      </div>
    </AuthLayout>
  );
}
