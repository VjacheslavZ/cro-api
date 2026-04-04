import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Link, IconButton, Stack } from '@mui/material';

import { XIcon, YouTubeIcon, FacebookIcon, GooglePlayIcon, AppStoreIcon } from '../assets/icons';

export function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 4,
        px: 2,
        backgroundColor: (theme) => theme.palette.grey[900],
        color: 'grey.300',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          {/* Navigation links */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="grey.100" fontWeight={600}>
              CroGrammar
            </Typography>
            <Link
              component="button"
              color="inherit"
              underline="hover"
              variant="body2"
              onClick={() => navigate('/about')}
            >
              {t('footer.aboutUs')}
            </Link>
            <Link
              component="button"
              color="inherit"
              underline="hover"
              variant="body2"
              onClick={() => navigate('/partners')}
            >
              {t('footer.forPartners')}
            </Link>
            <Link
              component="button"
              color="inherit"
              underline="hover"
              variant="body2"
              onClick={() => navigate('/contacts')}
            >
              {t('footer.contacts')}
            </Link>
          </Stack>

          {/* Social links */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="grey.100" fontWeight={600}>
              {t('footer.socials')}
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                color="inherit"
                size="small"
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <YouTubeIcon />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Mobile apps */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="grey.100" fontWeight={600}>
              {t('footer.mobileApps')}
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                color="inherit"
                size="small"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GooglePlayIcon />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AppStoreIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Typography variant="body2" color="grey.500" sx={{ mt: 4, textAlign: 'center' }}>
          &copy; {year} CroGrammar. {t('footer.rights')}
        </Typography>
      </Container>
    </Box>
  );
}
