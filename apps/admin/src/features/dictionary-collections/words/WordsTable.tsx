/**
 * @module WordsTable
 * @description Pure display table for predefined words in a collection. Renders columns for
 * wordHr and all three translations (EN/UK/RU), plus sortOrder and edit/delete actions.
 * Pagination is injected as a render-prop component from the parent (CollectionWordsPage via
 * useTablePagination), keeping slice logic out of this component.
 * @usedBy CollectionWordsPage
 */
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

import type { PredefinedWordItem } from './AddWordForm';

interface WordsTableProps {
  items: PredefinedWordItem[];
  onEdit: (item: PredefinedWordItem) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  Pagination: () => React.JSX.Element;
}

/**
 * Renders the predefined words table with edit and delete actions.
 * @param props.items - Paginated slice of predefined words for the current page.
 * @param props.onEdit - Called with the selected word item; parent shows AddWordForm pre-populated.
 * @param props.onDelete - Called with the word id to delete.
 * @param props.isDeletePending - Disables all delete buttons while a delete request is in flight.
 * @param props.Pagination - Render-prop component from useTablePagination; rendered below the table.
 */
export function WordsTable({
  items,
  onEdit,
  onDelete,
  isDeletePending,
  Pagination,
}: WordsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Word (HR)</TableCell>
            <TableCell>EN</TableCell>
            <TableCell>UA</TableCell>
            <TableCell>RU</TableCell>
            <TableCell>Order</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.wordHr}</TableCell>
              <TableCell>{item.translationEn}</TableCell>
              <TableCell>{item.translationUk}</TableCell>
              <TableCell>{item.translationRu}</TableCell>
              <TableCell>{item.sortOrder}</TableCell>
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
          ))}
        </TableBody>
      </Table>
      <Pagination />
    </TableContainer>
  );
}
