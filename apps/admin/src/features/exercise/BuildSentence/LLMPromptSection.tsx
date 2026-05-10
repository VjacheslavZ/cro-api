import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesome, ExpandLess, ExpandMore } from '@mui/icons-material';

import { apiClient } from '../../../api/client.ts';

const FIXED_KEY = 'bsa_fixed_prompt';

// Generate a DIFFERENT sentence every time. Avoid repeating previous outputs.
const DEFAULT_FIXED_PROMPT = `
  TRANSLATIONS:
  Provide correct translations to:
  - Russian
  - Ukrainian
  - English
    
  DISTRACTORS RULES:
  - For EACH word, generate EXACTLY 5 distractors
  - Distractors MUST be similar to the word:
    - Same part of speech (pronoun, verb, noun, etc.)
    - Similar meaning OR commonly confused alternatives
  - Examples:
    - "ja" → ["ti","on","mi","vi","oni"]
    - "hoćeš" → ["želiš","moraš","trebaš","planiraš","pokušavaš"]
  - Do NOT include the original word
  - Do NOT use random or unrelated words
  - No duplicates
  
  FORMAT RULES (STRICT):
  - Return ONLY valid JSON
  - NO explanations
  - NO extra text
  - ALL fields are required
  - Do NOT skip anything
  
  OUTPUT FORMAT:
  {
    "sentence": "...",
    "translationRu": "...",
    "translationUk": "...",
    "translationEn": "...",
    "distractors": [
      { "word": ["...", "...", "...", "...", "..."] },
      { "word": ["...", "...", "...", "...", "..."] }
    ]
  }
`;

export interface GeneratedSentenceData {
  sentenceHr: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  words: { wordHr: string; position: number; distractors: string[] }[];
}

interface LLMRawResponse {
  sentence: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  distractors: Record<string, string[]>[];
}

interface Props {
  topicId: string;
  onGenerate: (data: GeneratedSentenceData) => void;
}

export function LLMPromptSection({ topicId, onGenerate }: Props) {
  const promptKey = `bsa_prompt_${topicId}`;

  const [userPrompt, setUserPrompt] = useState(() => localStorage.getItem(promptKey) ?? '');
  const [fixedPrompt, setFixedPrompt] = useState(
    () => localStorage.getItem(FIXED_KEY) ?? DEFAULT_FIXED_PROMPT,
  );
  const [fixedExpanded, setFixedExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(promptKey, userPrompt);
  }, [promptKey, userPrompt]);

  useEffect(() => {
    localStorage.setItem(FIXED_KEY, fixedPrompt);
  }, [fixedPrompt]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: raw } = await apiClient.post<{ response: string }>('/admin/llm/generate', {
        prompt: `${userPrompt}\n\n${fixedPrompt}`,
        options: { temperature: 1, top_p: 0.9, repeat_penalty: 1.2 },
      });
      const data: LLMRawResponse = JSON.parse(raw.response);

      const tokens = data.sentence
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.replace(/[.,!?;:]+$/, ''));

      onGenerate({
        sentenceHr: tokens.join(' '),
        translationRu: data.translationRu,
        translationUk: data.translationUk,
        translationEn: data.translationEn,
        words: tokens.map((wordHr, idx) => ({
          wordHr,
          position: idx,
          distractors: (Object.values(data.distractors[idx] ?? {})[0] ?? []).slice(0, 5),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mb: 2,
        p: 1.5,
        bgColor: 'grey.50',
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1, fontWeight: 600 }}
      >
        Generate with LLM
      </Typography>

      <TextField
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="Promt"
        multiline
        size="small"
        fullWidth
        sx={{ mb: 1 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Format prompt (fixed, appended automatically)
        </Typography>
        <IconButton size="small" onClick={() => setFixedExpanded((v) => !v)}>
          {fixedExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={fixedExpanded}>
        <TextField
          value={fixedPrompt}
          onChange={(e) => setFixedPrompt(e.target.value)}
          multiline
          rows={4}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 12 } } }}
          sx={{ mb: 1 }}
        />
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        size="small"
        variant="outlined"
        startIcon={isLoading ? <CircularProgress size={14} /> : <AutoAwesome fontSize="small" />}
        onClick={handleGenerate}
        disabled={isLoading || !userPrompt.trim()}
      >
        {isLoading ? 'Generating…' : 'Generate sentence'}
      </Button>
    </Box>
  );
}
