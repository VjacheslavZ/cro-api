import { useTranslation } from 'react-i18next';
import { Container, Typography } from '@mui/material';

export function VocabularyPage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('exercises.vocabulary.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t('exercises.vocabulary.subtitle')}
      </Typography>
    </Container>
  );
}
