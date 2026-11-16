import { Box, LinearProgress, Typography } from '@mui/material';

import type { ImportProgress } from './useWordsImport';

/** Determinate progress of the batched upload, in rows sent. */
export function ImportProgressBar({ progress }: { progress: ImportProgress }) {
  const percent = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <Box>
      <LinearProgress variant="determinate" value={percent} />
      <Typography variant="caption" color="text.secondary">
        Importing {progress.done} / {progress.total}…
      </Typography>
    </Box>
  );
}
