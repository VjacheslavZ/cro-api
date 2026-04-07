import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Alert,
  Chip,
} from '@mui/material';

import { useDictionaryCollections } from '../../api/dictionary';
import { QueryState } from '../../shared/components/QueryState';

export function WordSetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: collections = [], isLoading, isError } = useDictionaryCollections();

  const predefined = collections.filter((c) => c.type === 'predefined');

  const queryState = QueryState({ isLoading, isError });
  if (queryState) return queryState;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">{t('dictionary.wordSets.title')}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {t('dictionary.wordSets.subtitle')}
        </Typography>
      </Box>

      {predefined.length === 0 ? (
        <Alert severity="info">{t('dictionary.wordSets.noSets')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {predefined.map((c) => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(`/dictionary/collections/${c.id}`)}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {c.name}
                    </Typography>
                    {c.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {c.description}
                      </Typography>
                    )}
                    <Chip
                      label={t('dictionary.collections.wordsInSet', {
                        count: c.predefinedWordCount ?? 0,
                      })}
                      size="small"
                      variant="outlined"
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
