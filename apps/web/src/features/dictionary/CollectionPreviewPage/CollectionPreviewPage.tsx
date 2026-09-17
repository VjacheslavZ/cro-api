import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PredefinedDictionaryWord } from '@cro/shared';
import { ArrowLeftIcon, InfoIcon, LibraryIcon, Loader2Icon, Volume2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/PageContainer';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAppSelector } from '../../../store';
import { speakWord } from '../../../shared/lib/speech';
import {
  useCollectionWords,
  useAddSet,
  useDictionaryCollections,
} from '../../../api/dictionary.ts';
import { QueryState } from '../../../shared/components/QueryState.tsx';

/**
 * Route: /dictionary/collections/:collectionId
 *
 * Previews all words in an admin-created predefined collection. The user can
 * select individual words (or all) and add them to their personal dictionary
 * in bulk via the "Add Selected" button. Already-owned words are skipped
 * server-side and reported in the success snackbar (added / skipped counts).
 *
 * Reached from: WordSetsPage (/dictionary/recommended-word-sets).
 */

/** Returns the translation for a predefined word in the user's native language. */
function getTranslation(word: PredefinedDictionaryWord, lang: string | null): string {
  if (lang === 'RU') return word.translationRu;
  if (lang === 'UK') return word.translationUk;
  return word.translationEn;
}

export function CollectionPreviewPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const nativeLanguage = useAppSelector((state) => state.auth.user?.nativeLanguage ?? null);

  const { data: words = [], isLoading, isError } = useCollectionWords(collectionId!);
  const { data: collections = [] } = useDictionaryCollections();
  const addSet = useAddSet();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const collection = collections.find((c) => c.id === collectionId);
  const allSelected = words.length > 0 && selectedIds.size === words.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((w) => w.id)));
    }
  };

  const handleAdd = () => {
    const wordIds = selectedIds.size === words.length ? undefined : Array.from(selectedIds);
    addSet.mutate(
      { collectionId: collectionId!, wordIds },
      {
        onSuccess: (result) => {
          toast.success(
            t('dictionary.collections.addSetSuccess', {
              added: result.addedCount,
              skipped: result.skippedCount,
            }),
          );
          setSelectedIds(new Set());
        },
      },
    );
  };

  const queryState = QueryState({ isLoading, isError });
  if (queryState) return queryState;

  return (
    <PageContainer size="md" className="py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/dictionary/recommended-word-sets')}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        {t('dictionary.collections.title')}
      </Button>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{collection?.name ?? ''}</h1>
          {collection?.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {t('dictionary.collections.wordsInSet', { count: words.length })}
          </p>
        </div>
        <Button disabled={addSet.isPending || selectedIds.size === 0} onClick={handleAdd}>
          {addSet.isPending ? (
            <Loader2Icon className="animate-spin" data-icon="inline-start" />
          ) : (
            <LibraryIcon data-icon="inline-start" />
          )}
          {t('dictionary.collections.addSelected', { count: selectedIds.size })}
        </Button>
      </div>

      {words.length === 0 ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>{t('dictionary.collections.noWords')}</AlertTitle>
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedIds.size > 0 && !allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>{t('dictionary.word')}</TableHead>
                <TableHead>{t('dictionary.translation')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {words.map((word) => (
                <TableRow
                  key={word.id}
                  data-state={selectedIds.has(word.id) ? 'selected' : undefined}
                  onClick={() => toggleSelect(word.id)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Checkbox checked={selectedIds.has(word.id)} aria-label={word.wordHr} />
                  </TableCell>
                  <TableCell>{word.wordHr}</TableCell>
                  <TableCell>{getTranslation(word, nativeLanguage)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(word.wordHr);
                      }}
                      aria-label={t('dictionary.listen')}
                    >
                      <Volume2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
