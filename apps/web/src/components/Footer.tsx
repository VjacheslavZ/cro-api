import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Grid, Link } from '@mui/material';

import { XIcon, YouTubeIcon, FacebookIcon, GooglePlayIcon, AppStoreIcon } from '../assets/icons';

const socialLinks = [
  { href: 'https://x.com', icon: <XIcon />, label: 'X / Twitter' },
  { href: 'https://youtube.com', icon: <YouTubeIcon />, label: 'YouTube' },
  { href: 'https://facebook.com', icon: <FacebookIcon />, label: 'Facebook' },
];

const appLinks = [
  { href: '#', icon: <GooglePlayIcon />, label: 'Google Play' },
  { href: '#', icon: <AppStoreIcon />, label: 'App Store' },
];

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ mt: 'auto', bgcolor: 'grey.900', color: 'grey.300' }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Grid container spacing={4}>
          {/* Branding */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mb: 1.5 }}>
              CroGrammar
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', lineHeight: 1.6 }}>
              {t('footer.tagline')}
            </Typography>
          </Grid>

          {/* Company links */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
              {t('footer.company')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: t('footer.aboutUs'), to: '/about' },
                { label: t('footer.forPartners'), to: '/partners' },
                { label: t('footer.contacts'), to: '/contacts' },
              ].map((link) => (
                <Link
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  underline="hover"
                  variant="body2"
                  sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Follow Us */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
              {t('footer.socials')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {socialLinks.map((s) => (
                <Box
                  key={s.label}
                  component="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'grey.800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'grey.300',
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: 'grey.700' },
                    textDecoration: 'none',
                  }}
                >
                  {s.icon}
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Get the App */}
          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
              {t('footer.mobileApps')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {appLinks.map((a) => (
                <Box
                  key={a.label}
                  component="a"
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={a.label}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'grey.800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'grey.300',
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: 'grey.700' },
                    textDecoration: 'none',
                  }}
                >
                  {a.icon}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'grey.800',
            mt: 2,
            pt: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            &copy; {year} CroGrammar. {t('footer.rights')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
