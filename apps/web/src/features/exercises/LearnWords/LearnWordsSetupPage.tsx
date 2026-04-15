/**
 * @module LearnWordsSetupPage
 * @description Step 1 of the Learn Words flow. User selects word count (5/10/15/20)
 * and filter (newest/oldest/progress). On "Next", fetches the word preview via
 * useLearnWordsPreview, then navigates to LearnWordsPreviewPage once words load.
 * Supports optional collectionId from URL search params to scope the word pool.
 * @usedBy AppRouter (/exercises/vocabulary/learn)
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

import { useLearnWordsPreview } from '../../../api/dictionary';

const COUNT_OPTIONS = [5, 10, 15, 20];
const FILTER_OPTIONS = ['newest', 'oldest', 'progress'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

/**
 * Renders the Learn Words configuration form and initiates the word preview fetch.
 * Navigation to the preview page happens reactively once the query returns data.
 */
export function LearnWordsSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId') ?? undefined;

  const [count, setCount] = useState(10);
  const [filter, setFilter] = useState<FilterOption>('newest');
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const {
    data: words,
    isLoading,
    isError,
  } = useLearnWordsPreview({ count, filter, collectionId }, fetchEnabled);

  const handleNext = () => {
    setFetchEnabled(true);
  };

  // Navigate once words are loaded
  if (words && fetchEnabled) {
    navigate('/exercises/vocabulary/learn/preview', {
      state: { words, collectionId },
    });
    return null;
  }

  const filterLabelKey: Record<FilterOption, string> = {
    newest: 'exercises.learnWords.filterNewest',
    oldest: 'exercises.learnWords.filterOldest',
    progress: 'exercises.learnWords.filterProgress',
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/exercises/vocabulary')}
        sx={{ mb: 2 }}
      >
        {t('exercises.vocabulary.title')}
      </Button>

      <Typography variant="h4" gutterBottom>
        {t('exercises.learnWords.setupTitle')}
      </Typography>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
        {t('exercises.learnWords.wordCount')}
      </Typography>
      <ToggleButtonGroup
        value={count}
        exclusive
        onChange={(_, val) => {
          if (val !== null) setCount(val);
        }}
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {COUNT_OPTIONS.map((n) => (
          <ToggleButton key={n} value={n} sx={{ minWidth: 56 }}>
            {n}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
        {t('exercises.learnWords.filter')}
      </Typography>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val) => {
          if (val !== null) setFilter(val);
        }}
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {FILTER_OPTIONS.map((f) => (
          <ToggleButton key={f} value={f}>
            {t(filterLabelKey[f])}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('common.error')}
        </Alert>
      )}

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleNext}
          disabled={isLoading}
          fullWidth
        >
          {t('exercises.learnWords.next')}
        </Button>
      </Box>
    </Container>
  );
}
