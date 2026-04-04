import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Box, Typography, Container, Paper, Alert, Divider } from '@mui/material';

import { useAppDispatch } from '../../store';
import { setCredentials, type UserProfile } from '../../store/auth.slice';
import { setTokens } from '../../shared/lib/auth-storage';
import { apiClient } from '../../api/client';
import { EmailAuthForm } from './EmailAuthForm';

export function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSuccess = (data: {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
    isNewUser: boolean;
  }) => {
    setTokens(data.accessToken, data.refreshToken);
    dispatch(setCredentials({ user: data.user }));
    if (data.isNewUser || !data.user.nativeLanguage) {
      navigate('/language-select', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.post('/auth/google', { token: codeResponse.code });
        handleAuthSuccess(data);
      } catch (err) {
        console.error('Google login failed:', err);
        setError(t('auth.loginFailed'));
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google OAuth error:', errorResponse);
      setError(t('auth.loginFailed'));
    },
  });

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
              onClick={() => googleLogin()}
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
            onSuccess={handleAuthSuccess}
            onError={(msg) => setError(msg || null)}
          />
        </Paper>
      </Box>
    </Container>
  );
}
