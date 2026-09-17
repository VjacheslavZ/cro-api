import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client.ts';

type AuthMode = 'login' | 'register';

interface EmailAuthFormProps {
  mode: AuthMode;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function EmailAuthForm({
  mode,
  loading,
  setLoading,
  onSuccess,
  onError,
}: EmailAuthFormProps) {
  const { t } = useTranslation();
  const id = useId();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    onError('');
    try {
      if (mode === 'register') {
        const result = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        if (result.error) {
          onError(result.error.message || t('auth.registrationFailed'));
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });
        if (result.error) {
          onError(result.error.message || t('auth.loginFailed'));
          return;
        }
      }
      onSuccess();
    } catch {
      onError(mode === 'register' ? t('auth.registrationFailed') : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFormData({ name: '', email: '', password: '' });
  }, [mode]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'register' && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>{t('auth.name')}</Label>
          <Input
            id={`${id}-name`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`${id}-email`}>{t('auth.email')}</Label>
        <Input
          id={`${id}-email`}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-password`}>{t('auth.password')}</Label>
        <Input
          id={`${id}-password`}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
          disabled={loading}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2Icon className="animate-spin" />}
        {mode === 'register' ? t('auth.register') : t('auth.login')}
      </Button>
    </form>
  );
}
