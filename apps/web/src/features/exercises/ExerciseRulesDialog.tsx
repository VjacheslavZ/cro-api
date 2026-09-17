/**
 * @module ExerciseRulesDialog
 * @description Modal dialog that renders the rich-text HTML grammar rules for an exercise topic.
 * Opened non-blocking from SessionPage via the "Show Rules" button when a topic has rules.
 * @usedBy SessionPage
 */
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExerciseRulesDialogProps {
  open: boolean;
  onClose: () => void;
  rulesHtml: string;
}

/**
 * Typography for admin-authored HTML (Tiptap output). Tailwind's preflight strips
 * default heading/list styles, so they are restored here for the rules content only.
 */
const rulesProseClass = [
  'text-sm leading-relaxed',
  '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold',
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold',
  '[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_p]:mb-2',
  '[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:mb-1',
  '[&_strong]:font-semibold',
  '[&_blockquote]:border-l-[3px] [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
].join(' ');

/**
 * Displays grammar rules HTML in a non-blocking dialog.
 * @param props.open - Whether the dialog is visible
 * @param props.onClose - Called when user closes the dialog; session continues uninterrupted
 * @param props.rulesHtml - Raw HTML string authored in the admin's Tiptap rich-text editor
 */
export function ExerciseRulesDialog({ open, onClose, rulesHtml }: ExerciseRulesDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('exercises.rules.title')}</DialogTitle>
        </DialogHeader>
        <div className={rulesProseClass} dangerouslySetInnerHTML={{ __html: rulesHtml }} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t('common.close')}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
