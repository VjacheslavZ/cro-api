import { Paper } from '@mui/material';

import { CreateAdminForm } from './CreateAdminForm';

interface CreateAdminTabProps {
  onCreated: () => void;
}

export function CreateAdminTab({ onCreated }: CreateAdminTabProps) {
  return (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <CreateAdminForm onCreated={onCreated} />
    </Paper>
  );
}
