/**
 * @module VocabularyPage
 * @description Vocabulary exercises hub. Offers the "Learn Words" guided flow and four
 * individual practice modes (word-to-translate, translate-to-word, letter-pick, matching).
 * Each mode starts a DictionaryPracticeSession and navigates to DictionaryPracticePage.
 * @usedBy AppRouter (/exercises/vocabulary)
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import {
  Translate,
  TextFields,
  GridOn,
  HearingOutlined,
  School,
  Timer,
  ArrowForward,
} from '@mui/icons-material';

import { useStartDictionaryPractice } from '../../api/dictionary';

type ExerciseDirection = 'word-to-translate' | 'translate-to-word' | 'letter-pick' | 'matching';

const SESSION_WORD_COUNT = 10;

const SECTION_HEADER_SX = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  mb: 1.5,
  mt: 1,
};

/**
 * Renders the vocabulary exercise mode selection screen.
 * Passes `collectionId` from URL search params to filter practice words by collection.
 */
export function VocabularyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const startPractice = useStartDictionaryPractice();
  const [pendingDirection, setPendingDirection] = useState<ExerciseDirection | null>(null);
  const [speedQuizLoading, setSpeedQuizLoading] = useState(false);
  const [speedQuizError, setSpeedQuizError] = useState(false);

  const handleStartSpeedQuiz = async () => {
    setSpeedQuizLoading(true);
    setSpeedQuizError(false);
    try {
      const result = await startPractice.mutateAsync({ learnedOnly: true });
      navigate('/exercises/vocabulary/speed-quiz', {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
          sessionId: result.sessionId,
        },
      });
    } catch {
      setSpeedQuizError(true);
    } finally {
      setSpeedQuizLoading(false);
    }
  };

  const handleStart = async (direction: ExerciseDirection) => {
    setPendingDirection(direction);
    try {
      const result = await startPractice.mutateAsync({ count: SESSION_WORD_COUNT });
      navigate(`/dictionary/practice/${result.sessionId}`, {
        state: {
          items: result.items,
          totalQuestions: result.totalQuestions,
          direction,
          backPath: '/exercises/vocabulary',
        },
      });
    } catch {
      // Error handled by mutation state
    } finally {
      setPendingDirection(null);
    }
  };

  const exercises: {
    direction: ExerciseDirection;
    icon: React.ReactNode;
    titleKey: string;
    descKey: string;
  }[] = [
    {
      direction: 'word-to-translate',
      icon: <Translate sx={{ fontSize: 32, color: '#2563eb' }} />,
      titleKey: 'exercises.vocabulary.wordToTranslate',
      descKey: 'exercises.vocabulary.wordToTranslateDesc',
    },
    {
      direction: 'translate-to-word',
      icon: <TextFields sx={{ fontSize: 32, color: '#9333ea' }} />,
      titleKey: 'exercises.vocabulary.translateToWord',
      descKey: 'exercises.vocabulary.translateToWordDesc',
    },
    {
      direction: 'letter-pick',
      icon: <GridOn sx={{ fontSize: 32, color: '#16a34a' }} />,
      titleKey: 'exercises.vocabulary.letterPick',
      descKey: 'exercises.vocabulary.letterPickDesc',
    },
    {
      direction: 'matching',
      icon: <HearingOutlined sx={{ fontSize: 32, color: '#d97706' }} />,
      titleKey: 'exercises.vocabulary.matching',
      descKey: 'exercises.vocabulary.matchingDesc',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ maxWidth: 768, mx: 'auto' }}>
        {/* Page header */}
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          {t('exercises.vocabulary.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('exercises.vocabulary.subtitle')}
        </Typography>

        {startPractice.isError && !speedQuizError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('dictionary.practice.noWords')}
          </Alert>
        )}
        {speedQuizError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('exercises.speedQuiz.notEnoughWords')}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Featured: Learn Words */}
          <Box
            onClick={() =>
              navigate(
                `/exercises/vocabulary/learn${collectionId ? `?collectionId=${collectionId}` : ''}`,
              )
            }
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 3,
              border: '2px solid #bfdbfe',
              borderRadius: 2,
              bgcolor: '#eff6ff',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderColor: '#93c5fd' },
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 64,
                height: 64,
                bgcolor: '#dbeafe',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <School sx={{ fontSize: 32, color: '#2563eb' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.25 }}>
                {t('exercises.vocabulary.learnWords')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('exercises.vocabulary.learnWordsDesc')}
              </Typography>
            </Box>
            <ArrowForward sx={{ color: '#2563eb', flexShrink: 0 }} />
          </Box>

          {/* Featured: Speed Quiz */}
          <Box
            onClick={handleStartSpeedQuiz}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 3,
              border: '2px solid #fde68a',
              borderRadius: 2,
              bgcolor: '#fffbeb',
              cursor: speedQuizLoading || pendingDirection !== null ? 'default' : 'pointer',
              opacity: speedQuizLoading || pendingDirection !== null ? 0.7 : 1,
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover':
                speedQuizLoading || pendingDirection !== null
                  ? {}
                  : { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderColor: '#fbbf24' },
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 64,
                height: 64,
                bgcolor: '#fef3c7',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {speedQuizLoading ? (
                <CircularProgress size={32} sx={{ color: '#d97706' }} />
              ) : (
                <Timer sx={{ fontSize: 32, color: '#d97706' }} />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.25 }}>
                {t('exercises.vocabulary.speedQuiz')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('exercises.vocabulary.speedQuizDesc')}
              </Typography>
            </Box>
            <ArrowForward sx={{ color: '#d97706', flexShrink: 0 }} />
          </Box>

          {/* Section label */}
          <Typography sx={SECTION_HEADER_SX}>
            {t('exercises.vocabulary.practiceModesLabel')}
          </Typography>

          {/* Individual practice modes */}
          {exercises.map(({ direction, icon, titleKey, descKey }) => {
            const isLoading = pendingDirection === direction;
            const isDisabled = pendingDirection !== null;
            return (
              <Box
                key={direction}
                onClick={() => !isDisabled && handleStart(direction)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  p: 3,
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 2,
                  bgcolor: 'white',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled && !isLoading ? 0.6 : 1,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': isDisabled
                    ? {}
                    : { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderColor: '#93c5fd' },
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 64,
                    height: 64,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isLoading ? <CircularProgress size={32} /> : icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.25 }}>
                    {t(titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(descKey)}
                  </Typography>
                </Box>
                <ArrowForward sx={{ color: 'text.secondary', flexShrink: 0 }} />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Container>
  );
}
