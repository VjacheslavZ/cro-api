import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import { QueryState } from '../../shared/components/QueryState';

interface Admin {
  id: string;
  email: string;
  createdAt: string;
}

export function AdminsTab() {
  const {
    data: admins,
    isLoading,
    error,
  } = useQuery<Admin[]>({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/admins');
      return data;
    },
  });

  const queryState = QueryState({ isLoading, error });
  if (queryState) return queryState;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {admins?.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.email}</TableCell>
              <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
