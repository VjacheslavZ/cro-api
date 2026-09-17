import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from 'lucide-react';

import { PageContainer } from '@/components/PageContainer';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { useDictionaryCollections } from '../../api/dictionary';
import { QueryState } from '../../shared/components/QueryState';

/**
 * Route: /dictionary/recommended-word-sets
 *
 * Displays all admin-created predefined dictionary collections as browsable
 * cards. Each card shows the collection name, description, and total word
 * count. Clicking navigates to CollectionPreviewPage
 * (/dictionary/collections/:collectionId) where the user can preview words
 * and add them to their personal dictionary.
 */
export function WordSetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: collections = [], isLoading, isError } = useDictionaryCollections();

  const predefined = collections.filter((c) => c.type === 'predefined');

  const queryState = QueryState({ isLoading, isError });
  if (queryState) return queryState;

  return (
    <PageContainer size="md" className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{t('dictionary.wordSets.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('dictionary.wordSets.subtitle')}</p>
      </div>

      {predefined.length === 0 ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>{t('dictionary.wordSets.noSets')}</AlertTitle>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {predefined.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/dictionary/collections/${c.id}`)}
              className="rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <p className="mb-1 text-lg font-medium">{c.name}</p>
              {c.description && (
                <p className="mb-3 text-sm text-muted-foreground">{c.description}</p>
              )}
              <Badge variant="outline">
                {t('dictionary.collections.wordsInSet', { count: c.predefinedWordCount ?? 0 })}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
