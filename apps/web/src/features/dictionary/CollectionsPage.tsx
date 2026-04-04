import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

import { useDictionaryCollections, useDeleteCollection } from '../../api/dictionary';
import { CreateCollectionModal } from './CreateCollectionModal';

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

  const predefined = collections.filter((c) => c.type === 'predefined');
  const personal = collections.filter((c) => c.type === 'personal');

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

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{t('common.error')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('dictionary.collections.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          {t('dictionary.collections.createCollection')}
        </Button>
      </Box>

      {/* Predefined Collections */}
      {predefined.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('dictionary.collections.predefined')}
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {predefined.map((c) => (
              <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/dictionary/my?collectionId=${c.id}`)}
                >
                  <CardContent>
                    <Typography variant="h6">{c.name}</Typography>
                    {c.description && (
                      <Typography variant="body2" color="text.secondary">
                        {c.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {t('dictionary.collections.wordCount', { count: c.wordCount })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Personal Collections */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('dictionary.collections.personal')}
      </Typography>
      {personal.length === 0 ? (
        <Typography color="text.secondary">{t('dictionary.collections.noCollections')}</Typography>
      ) : (
        <Grid container spacing={2}>
          {personal.map((c) => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardContent
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/dictionary/my?collectionId=${c.id}`)}
                >
                  <Typography variant="h6">{c.name}</Typography>
                  {c.description && (
                    <Typography variant="body2" color="text.secondary">
                      {c.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {t('dictionary.collections.wordCount', { count: c.wordCount })}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" onClick={() => handleEdit(c)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(c.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CreateCollectionModal open={modalOpen} onClose={handleCloseModal} editData={editData} />
    </Container>
  );
}
