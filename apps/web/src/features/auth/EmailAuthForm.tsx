import { startTransition, useActionState, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client.ts';

type AuthMode = 'login' | 'register';

interface EmailAuthFormProps {
  mode: AuthMode;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
}

interface FormState {
  error: string | null;
}

export function EmailAuthForm({ mode }: EmailAuthFormProps) {
  const { t } = useTranslation();
  const id = useId();

  // Inputs stay controlled so a failed attempt keeps what was typed.
  const [formData, setFormData] = useState<FormValues>({ name: '', email: '', password: '' });

  const [{ error }, submit, isPending] = useActionState<FormState, FormValues>(
    async (_prev, values) => {
      const fallback = mode === 'register' ? t('auth.registrationFailed') : t('auth.loginFailed');
      try {
        const result =
          mode === 'register'
            ? await authClient.signUp.email(values)
            : await authClient.signIn.email({ email: values.email, password: values.password });
        return { error: result.error ? result.error.message || fallback : null };
      } catch {
        return { error: fallback };
      }
    },
    { error: null },
  );

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    startTransition(() => submit(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorAlert message={error} />}
      {mode === 'register' && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>{t('auth.name')}</Label>
          <Input
            id={`${id}-name`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        {mode === 'register' ? t('auth.register') : t('auth.login')}
      </Button>
    </form>
  );
}
