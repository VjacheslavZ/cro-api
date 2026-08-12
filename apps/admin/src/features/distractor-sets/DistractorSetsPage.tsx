import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import { DistractorSetsTable } from './DistractorSetsTable';
import { DistractorSetForm } from './DistractorSetForm';

export interface DistractorSetData {
  id: string;
  name: string;
  words: string[];
}

export function DistractorSetsPage() {
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState<DistractorSetData | null>(null);

  const handleEdit = (set: DistractorSetData) => {
    setEditing(set);
    setTab(1);
  };

  const handleDone = () => {
    setEditing(null);
    setTab(0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Distractor Sets
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            if (v === 0) setEditing(null);
          }}
        >
          <Tab label="Sets" />
          <Tab label={editing ? 'Edit Set' : 'Create Set'} />
        </Tabs>
      </Box>

      {tab === 0 && <DistractorSetsTable onEdit={handleEdit} />}
      {tab === 1 && <DistractorSetForm set={editing} onDone={handleDone} />}
    </Box>
  );
}
