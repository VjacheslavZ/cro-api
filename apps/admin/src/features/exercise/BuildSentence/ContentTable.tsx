import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

import type { BuildSentenceItemData } from './AddBuildSentenceItem/AddBuildSentenceItem.tsx';

interface BuildSentenceTableProps {
  items: BuildSentenceItemData[];
  onEdit: (item: BuildSentenceItemData) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  Pagination: () => React.JSX.Element;
}

export function ContentTable({
  items,
  onEdit,
  onDelete,
  isDeletePending,
  Pagination,
}: BuildSentenceTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Sentence (HR)</TableCell>
            <TableCell>EN</TableCell>
            <TableCell>Words</TableCell>
            <TableCell>Order</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const sentence = item.words
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((w) => w.wordHr)
              .join(' ');
            return (
              <TableRow key={item.id}>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Typography variant="body2">{sentence}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary">
                    {item.translationEn}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                    {item.words
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((w) => (
                        <Chip
                          key={w.id}
                          label={`${w.wordHr} (${w.distractors.length})`}
                          size="small"
                          color={w.distractors.length < 5 ? 'warning' : 'default'}
                          variant="outlined"
                        />
                      ))}
                  </Box>
                </TableCell>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(item.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onEdit(item)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(item.id)}
                    disabled={isDeletePending}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Pagination />
    </TableContainer>
  );
}
