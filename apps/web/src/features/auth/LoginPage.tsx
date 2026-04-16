import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Box, Typography, Container, Paper, Alert, Divider } from '@mui/material';

import { authClient } from '../../lib/auth-client';
import { EmailAuthForm } from './EmailAuthForm';

export function LoginPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {t('auth.welcome')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LoadingButton
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              loading={loading}
              fullWidth
            >
              {t('auth.signInWithGoogle')}
            </LoadingButton>
          </Box>

          <Divider sx={{ my: 3 }}>{t('auth.orDivider')}</Divider>

          <EmailAuthForm
            loading={loading}
            setLoading={setLoading}
            onSuccess={() => setError(null)}
            onError={(msg) => setError(msg || null)}
          />
        </Paper>
      </Box>
    </Container>
  );
}
