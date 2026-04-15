/**
 * @module DictionaryCollectionsPage
 * @description Admin page for managing predefined dictionary collections.
 * Two-tab layout: "Collections" (table with edit/delete) and "Create/Edit Collection" (form).
 * Clicking Edit in the table switches to the form tab pre-populated with the selected collection.
 * Collections created here are public (isPublic: true) and visible to all students.
 * @usedBy AdminRouter (/dictionary-collections)
 */
import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import { CollectionsTable } from './CollectionsTable';
import { CreateCollectionForm } from './CreateCollectionForm';

/** Shape of a dictionary collection as returned by GET /admin/dictionary-collections. */
export interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  predefinedWordCount: number;
}

/**
 * Renders the tabbed collections management page.
 * Switching back to the "Collections" tab resets the edit state.
 */
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
