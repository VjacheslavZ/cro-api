import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Box, Typography, Paper, Alert, Divider, Button, Link } from '@mui/material';

import { authClient } from '../../lib/auth-client';
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
        p: 2,
      }}
    >
      {/* Logo + Branding */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            bgcolor: '#2563eb',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <Typography sx={{ color: 'white', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
            C
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          CroGrammar
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          {t('auth.tagline')}
        </Typography>
      </Box>

      {/* Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 2,
        }}
      >
        {/* Card header */}
        <Typography variant="h6" align="center" sx={{ fontWeight: 600, mb: 0.5 }}>
          {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
        </Typography>
        <Typography variant="body2" align="center" sx={{ color: '#6b7280', mb: 3 }}>
          {mode === 'login' ? t('auth.signInSubtitle') : t('auth.createAccountSubtitle')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Google button */}
        <LoadingButton
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          loading={loading}
          fullWidth
        >
          {t('auth.signInWithGoogle')}
        </LoadingButton>

        <Divider sx={{ my: 2.5 }}>{t('auth.orDivider')}</Divider>

        {/* Email form toggle */}
        {!showEmailForm ? (
          <Button
            variant="text"
            fullWidth
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

        {/* Login / register toggle */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={toggleMode}
            disabled={loading}
            sx={{ color: '#2563eb' }}
          >
            {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
