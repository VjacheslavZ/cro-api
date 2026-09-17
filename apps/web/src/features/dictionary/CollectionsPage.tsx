import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useDictionaryCollections, useDeleteCollection } from '../../api/dictionary';
import { QueryState } from '../../shared/components/QueryState';
import { CreateCollectionModal } from './CreateCollectionModal';

/**
 * Route: /dictionary/my-collections
 *
 * Displays two sections:
 * - "From Word Sets" — predefined (admin-created) collections the user has
 *   already added words from, shown as read-only cards linking to the filtered
 *   My Dictionary view.
 * - "My Collections" — user-created personal collections with edit / delete
 *   actions. Clicking a card navigates to /dictionary/my?collectionId=<id>.
 *
 * Collection create / edit is handled by CreateCollectionModal.
 */
export function CollectionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: collections = [], isLoading, isError } = useDictionaryCollections();
  const deleteCollection = useDeleteCollection();

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<{
    id: string;
    name: string;
    description: string | null;
  } | null>(null);

  const personal = collections.filter((c) => c.type === 'personal');
  const addedWordSets = collections.filter(
    (c) => c.type === 'predefined' && (c.wordCount ?? 0) > 0,
  );

  const handleEdit = (c: { id: string; name: string; description: string | null }) => {
    setEditData(c);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCollection.mutateAsync(id);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const queryState = QueryState({ isLoading, isError });
  if (queryState) return queryState;

  const cardClass = 'flex flex-col rounded-xl border bg-card';
  const cardBodyClass =
    'flex-1 cursor-pointer rounded-xl p-4 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50';

  return (
    <PageContainer size="md" className="py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t('dictionary.collections.title')}</h1>
        <Button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          {t('dictionary.collections.createCollection')}
        </Button>
      </div>

      {/* Word sets the user has added words from */}
      {addedWordSets.length > 0 && (
        <>
          <h2 className="mb-4 text-lg font-medium">{t('dictionary.collections.fromWordSets')}</h2>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {addedWordSets.map((c) => (
              <div key={c.id} className={cardClass}>
                <button
                  type="button"
                  className={cardBodyClass}
                  onClick={() => navigate(`/dictionary/my?collectionId=${c.id}`)}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg font-medium">{c.name}</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {t('dictionary.collections.wordSet')}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('dictionary.collections.wordCount', { count: c.wordCount })}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Personal collections */}
      <h2 className="mb-4 text-lg font-medium">{t('dictionary.collections.personal')}</h2>
      {personal.length === 0 ? (
        <p className="text-muted-foreground">{t('dictionary.collections.noCollections')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {personal.map((c) => (
            <div key={c.id} className={cardClass}>
              <button
                type="button"
                className={cardBodyClass}
                onClick={() => navigate(`/dictionary/my?collectionId=${c.id}`)}
              >
                <p className="text-lg font-medium">{c.name}</p>
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {t('dictionary.collections.wordCount', { count: c.wordCount })}
                </p>
              </button>
              <div className="flex gap-1 px-2 pb-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(c)}
                  aria-label={t('dictionary.collections.edit')}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(c.id)}
                  aria-label={t('dictionary.delete')}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCollectionModal open={modalOpen} onClose={handleCloseModal} editData={editData} />
    </PageContainer>
  );
}
