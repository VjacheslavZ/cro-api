/**
 * @module ExerciseRulesDialog
 * @description Modal dialog that renders the rich-text HTML grammar rules for an exercise topic.
 * Opened non-blocking from SessionPage via the "Show Rules" button when a topic has rules.
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button } from '@mui/material';

interface ExerciseRulesDialogProps {
  open: boolean;
  onClose: () => void;
  rulesHtml: string;
}

/**
 * Displays grammar rules HTML in a non-blocking MUI Dialog.
 * @param props.open - Whether the dialog is visible
 * @param props.onClose - Called when user closes the dialog; session continues uninterrupted
 * @param props.rulesHtml - Raw HTML string authored in the admin's Tiptap rich-text editor
 */
export function ExerciseRulesDialog({ open, onClose, rulesHtml }: ExerciseRulesDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('exercises.rules.title')}</DialogTitle>
      <DialogContent>
        <Box
          dangerouslySetInnerHTML={{ __html: rulesHtml }}
          sx={{
            '& h1': { fontSize: '1.5rem', fontWeight: 600, mt: 2, mb: 1 },
            '& h2': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 1 },
            '& h3': { fontSize: '1.1rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
            '& p': { mb: 1 },
            '& ul, & ol': { pl: 3, mb: 1 },
            '& li': { mb: 0.5 },
            '& strong': { fontWeight: 600 },
            '& blockquote': {
              borderLeft: 3,
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              color: 'text.secondary',
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
