import { useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '../../store';
import { setUser } from '../../store/auth.slice';
import { apiClient } from '../../api/client';
import i18n from '../../i18n';

type LanguageCode = 'RU' | 'UK' | 'EN';

// TODO move to const and reuse in SettingsPage.tsx
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
      {/* Logo + Title */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
          {t('auth.selectLanguage')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 420, mx: 'auto' }}>
          {t('auth.languageSubtitle')}
        </Typography>
      </Box>

      {/* Language Cards */}
      <Box sx={{ width: '100%', maxWidth: 680 }}>
        <Grid container spacing={2} justifyContent="center">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            const isDisabled = loading && !isSelected;
            return (
              <Grid key={lang.code} size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  onClick={() => !loading && handleSelect(lang.code)}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: loading ? 'default' : 'pointer',
                    border: isSelected ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.08)',
                    bgcolor: isSelected ? '#eff6ff' : 'white',
                    borderRadius: 2,
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    '&:hover': loading
                      ? {}
                      : {
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                          transform: 'scale(1.03)',
                          borderColor: isSelected ? '#2563eb' : '#93c5fd',
                        },
                  }}
                >
                  <Typography sx={{ fontSize: 52, lineHeight: 1, mb: 1.5 }}>{lang.flag}</Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}
                  >
                    {lang.nativeName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    {lang.name}
                  </Typography>
                  {isSelected && loading && (
                    <Box sx={{ mt: 2 }}>
                      <CircularProgress size={20} sx={{ color: '#2563eb' }} />
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Footer note */}
      <Typography variant="body2" sx={{ color: '#9ca3af', mt: 4 }}>
        {t('auth.changeLanguageLater')}
      </Typography>
    </Box>
  );
}
