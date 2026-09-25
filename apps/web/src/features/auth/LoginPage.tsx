import { startTransition, useActionState, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/auth-client.ts';
import { GoogleIcon } from '@/assets/icons';

import { AuthLayout } from './AuthLayout';
import { EmailAuthForm } from './EmailAuthForm';

type AuthMode = 'login' | 'register';

export function LoginPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [{ error }, signInWithGoogle, googlePending] = useActionState<{ error: string | null }>(
    async () => {
      try {
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: `${window.location.origin}/`,
        });
        return { error: null };
      } catch {
        return { error: t('auth.loginFailed') };
      }
    },
    { error: null },
  );

  const handleGoogleLogin = () => {
    startTransition(() => signInWithGoogle());
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <AuthLayout title="CroGrammar" subtitle={t('auth.tagline')}>
      <Card className="w-full max-w-[420px]">
        <CardContent className="p-8">
          <h2 className="mb-1 text-center text-lg font-semibold">
            {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? t('auth.signInSubtitle') : t('auth.createAccountSubtitle')}
          </p>

          {error && <ErrorAlert message={error} className="mb-4" />}

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={googlePending}
          >
            {googlePending ? <Loader2Icon className="animate-spin" /> : <GoogleIcon />}
            {t('auth.signInWithGoogle')}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" />
            {t('auth.orDivider')}
            <Separator className="flex-1" />
          </div>

          {!showEmailForm ? (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowEmailForm(true)}
              disabled={googlePending}
            >
              {t('auth.continueWithEmail')}
            </Button>
          ) : (
            <EmailAuthForm key={mode} mode={mode} />
          )}

          <div className="mt-4 text-center">
            <Button variant="link" size="sm" onClick={toggleMode} disabled={googlePending}>
              {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
