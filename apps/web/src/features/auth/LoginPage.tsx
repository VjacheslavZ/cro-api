import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { authClient } from '../../lib/auth-client';
import { GoogleIcon } from '../../assets/icons';
import { AuthLayout } from './AuthLayout';
import { EmailAuthForm } from './EmailAuthForm';

type AuthMode = 'login' | 'register';

export function LoginPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('login');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/`,
      });
    } catch {
      setError(t('auth.loginFailed'));
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError(null);
    setFormData({ name: '', email: '', password: '' });
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

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? <Loader2Icon className="animate-spin" /> : <GoogleIcon />}
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
              disabled={loading}
            >
              {t('auth.continueWithEmail')}
            </Button>
          ) : (
            <EmailAuthForm
              mode={mode}
              loading={loading}
              setLoading={setLoading}
              onSuccess={() => setError(null)}
              onError={(msg) => setError(msg || null)}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          <div className="mt-4 text-center">
            <Button variant="link" size="sm" onClick={toggleMode} disabled={loading}>
              {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
