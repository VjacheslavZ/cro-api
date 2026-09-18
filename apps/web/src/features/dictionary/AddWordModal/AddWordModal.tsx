import { useState, useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryCollection } from '@cro/shared';

import { ErrorAlert } from '@/components/ErrorAlert';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useAddWord,
  useTranslationSuggestions,
  useAiTranslation,
} from '../../../api/dictionary.ts';

/**
 * Modal dialog for adding a new word to the user's personal dictionary.
 *
 * Used in: MyDictionaryPage — opened via the "Add Word" button or by pressing
 * Enter in the search field (pre-fills `initialWord` with the search text).
 *
 * Behaviour:
 * - When `initialWord` is provided the Translation field receives focus after
 *   the dialog animation completes.
 * - Fetches shared translation suggestions as the user types (≥ 2 chars).
 * - Calls `onSuccess` after a successful save so the parent can reset the
 *   search input.
 * - Returns a 409 duplicate error (case-insensitive match) as an inline Alert.
 */
interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after the word is successfully added. */
  onSuccess?: () => void;
  /** Pre-fills the Croatian word field and shifts focus to Translation. */
  initialWord?: string;
  collections: DictionaryCollection[];
}

export function AddWordModal({
  open,
  onClose,
  onSuccess,
  initialWord = '',
  collections,
}: AddWordModalProps) {
  const translationRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        initialFocus={initialWord ? translationRef : undefined}
      >
        <AddWordForm
          initialWord={initialWord}
          collections={collections}
          onClose={onClose}
          onSuccess={onSuccess}
          translationRef={translationRef}
        />
      </DialogContent>
    </Dialog>
  );
}

interface AddWordFormProps extends Pick<
  AddWordModalProps,
  'onClose' | 'onSuccess' | 'collections'
> {
  initialWord: string;
  translationRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Form body rendered inside `DialogContent`. The dialog unmounts its content
 * on close, so the form state is seeded fresh from `initialWord` on every open
 * and discarded on close — no reset effect needed.
 */
function AddWordForm({
  initialWord,
  collections,
  onClose,
  onSuccess,
  translationRef,
}: AddWordFormProps) {
  const { t } = useTranslation();
  const id = useId();
  const [wordHr, setWordHr] = useState(initialWord);
  const [debouncedWord, setDebouncedWord] = useState(initialWord);
  const [translation, setTranslation] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [error, setError] = useState('');

  const addWord = useAddWord();
  const { data: suggestions, isLoading: suggestionsLoading } =
    useTranslationSuggestions(debouncedWord);
  const { data: aiData, isFetching: aiLoading } = useAiTranslation(debouncedWord);
  const aiTranslations = aiData?.translations ?? [];
  const aiSentences = aiData?.sentences ?? [];

  useEffect(() => {
    const id = setTimeout(() => setDebouncedWord(wordHr), 2000);
    return () => clearTimeout(id);
  }, [wordHr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && wordHr.trim() && translation.trim() && !addWord.isPending) {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError('');
    try {
      await addWord.mutateAsync({
        wordHr: wordHr.trim(),
        translation: translation.trim(),
        ...(collectionId ? { collectionId } : {}),
      });
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 409) {
          setError(t('dictionary.addWordModal.duplicate'));
          return;
        }
      }
      setError(t('common.error'));
    }
  };

  /** A clickable translation suggestion; highlighted when it matches the current input. */
  const suggestionChip = (label: string, value: string) => (
    <Badge
      key={label}
      render={<button type="button" />}
      variant={translation === value ? 'default' : 'outline'}
      className="h-6 cursor-pointer"
      onClick={() => setTranslation(value)}
    >
      {label}
    </Badge>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('dictionary.addWordModal.title')}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-word`}>{t('dictionary.addWordModal.wordLabel')}</Label>
          <Input id={`${id}-word`} value={wordHr} onChange={(e) => setWordHr(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${id}-translation`}>
            {t('dictionary.addWordModal.translationLabel')}
          </Label>
          <Input
            id={`${id}-translation`}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            ref={translationRef}
            onKeyDown={handleKeyDown}
          />
        </div>

        {wordHr.length >= 2 && (
          <div>
            <div className="flex flex-wrap items-center gap-1">
              {suggestionsLoading && <Spinner className="size-5" />}
              {!suggestionsLoading &&
                suggestions?.map((s) =>
                  suggestionChip(`${s.translation} (${s.count})`, s.translation),
                )}
              {aiLoading && <Spinner className="size-3.5" />}
              {!aiLoading && aiTranslations.map((tr) => suggestionChip(tr, tr))}
            </div>

            {!aiLoading && aiSentences.length > 0 && (
              <div className="mt-2 space-y-1 text-sm">
                {aiSentences.map((s) => (
                  <p key={s.hr}>
                    {s.hr} - <span className="text-muted-foreground">{s.translation}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {collections.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor={`${id}-collection`}>
              {t('dictionary.addWordModal.collectionLabel')}
            </Label>
            <Select value={collectionId} onValueChange={(value) => setCollectionId(value ?? '')}>
              <SelectTrigger id={`${id}-collection`} className="w-full">
                <SelectValue>
                  {(value: string) => collections.find((c) => c.id === value)?.name ?? '—'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t('dictionary.addWordModal.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!wordHr.trim() || !translation.trim() || addWord.isPending}
        >
          {t('dictionary.addWordModal.add')}
        </Button>
      </DialogFooter>
    </>
  );
}
