import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorAlert } from '@/components/ErrorAlert';
import { PageContainer } from '@/components/PageContainer';
import { ThemeToggleGroup } from '@/components/ThemeToggleGroup';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import i18n from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store';
import { setUser } from '../../store/auth.slice';
import { setSpeechEnabled } from '../../store/preferences.slice';
import { apiClient } from '../../api/client';

const languages = [
  { code: 'RU', label: 'Русский' },
  { code: 'UK', label: 'Українська' },
  { code: 'EN', label: 'English' },
] as const;

export function SettingsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const speechEnabled = useAppSelector((state) => state.preferences.speechEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const speechId = useId();

  const handleLanguageChange = async (value: string | undefined) => {
    if (!value || value === user?.nativeLanguage) return;

    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.patch('/users/me', { nativeLanguage: value });
      dispatch(setUser(data));
      i18n.changeLanguage(value.toLowerCase());
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer size="sm" className="py-8">
      <h1 className="mb-2 text-2xl font-semibold">{t('settings.title')}</h1>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-2 font-medium">{t('settings.nativeLanguage')}</h2>

        <ToggleGroup
          variant="outline"
          spacing={0}
          className="w-full *:flex-1"
          value={[user?.nativeLanguage ?? '']}
          onValueChange={(val) => handleLanguageChange(val[0] as string | undefined)}
          disabled={saving}
        >
          {languages.map((lang) => (
            <ToggleGroupItem key={lang.code} value={lang.code}>
              {lang.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {error && <ErrorAlert message={error} className="mt-4" />}

        <Separator className="my-4" />

        <h2 className="mb-2 font-medium">{t('settings.theme.title')}</h2>
        <ThemeToggleGroup className="w-full *:flex-1" />

        <Separator className="my-4" />

        <h2 className="mb-2 font-medium">{t('settings.speech.title')}</h2>
        <div className="flex items-center gap-3">
          <Switch
            id={speechId}
            checked={speechEnabled}
            onCheckedChange={(checked) => dispatch(setSpeechEnabled(checked))}
          />
          <Label htmlFor={speechId} className="font-normal">
            {t('settings.speech.autoPlay')}
          </Label>
        </div>
      </div>
    </PageContainer>
  );
}
