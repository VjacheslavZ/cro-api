import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import { CollectionsTable } from './CollectionsTable';
import { CreateCollectionForm } from './CreateCollectionForm';

export interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  predefinedWordCount: number;
}

export function DictionaryCollectionsPage() {
  const [tab, setTab] = useState(0);
  const [editingCollection, setEditingCollection] = useState<CollectionData | null>(null);

  const handleEdit = (collection: CollectionData) => {
    setEditingCollection(collection);
    setTab(1);
  };

  const handleFormDone = () => {
    setEditingCollection(null);
    setTab(0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dictionary Collections
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            if (v === 0) setEditingCollection(null);
          }}
        >
          <Tab label="Collections" />
          <Tab label={editingCollection ? 'Edit Collection' : 'Create Collection'} />
        </Tabs>
      </Box>
      {tab === 0 && <CollectionsTable onEdit={handleEdit} />}
      {tab === 1 && <CreateCollectionForm collection={editingCollection} onDone={handleFormDone} />}
    </Box>
  );
}
