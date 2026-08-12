import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import type { Lesson } from '@cro/shared';

import { LessonsTable } from './LessonsTable.tsx';
import { CreateLessonForm } from './CreateLessonForm.tsx';

export function LessonsPage() {
  const [tab, setTab] = useState(0);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTab(1);
  };

  const handleFormDone = () => {
    setEditingLesson(null);
    setTab(0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Lessons
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            if (v === 0) setEditingLesson(null);
          }}
        >
          <Tab label="Lessons" />
          <Tab label={editingLesson ? 'Edit Lesson' : 'Create Lesson'} />
        </Tabs>
      </Box>
      {tab === 0 && <LessonsTable onEdit={handleEdit} />}
      {tab === 1 && <CreateLessonForm lesson={editingLesson} onDone={handleFormDone} />}
    </Box>
  );
}
