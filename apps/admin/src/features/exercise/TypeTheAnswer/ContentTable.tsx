/**
 * @module TypeTheAnswer/ContentTable
 * @description Pure display table for Type the Answer items. Columns: baseForm, answer,
 * translations (EN/UK/RU), sortOrder, and edit/delete actions. Pagination injected as a
 * render-prop component from TypeTheAnswer via useTablePagination.
 * @usedBy TypeTheAnswer
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

import type { TypeTheAnswerItem } from './AddExerciseQuestion.tsx';

interface TypeTheAnswerTableProps {
  items: TypeTheAnswerItem[];
  onEdit: (item: TypeTheAnswerItem) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  Pagination: () => React.JSX.Element;
}

/**
 * Renders the Type the Answer items table with edit and delete actions.
 * @param props.items - Paginated slice of items for the current page.
 * @param props.onEdit - Called with the selected item; parent shows the form pre-populated.
 * @param props.onDelete - Called with the item id to delete.
 * @param props.isDeletePending - Disables all delete buttons while a delete is in flight.
 * @param props.Pagination - Render-prop component from useTablePagination; rendered below the table.
 */
export function ContentTable({
  items,
  onEdit,
  onDelete,
  isDeletePending,
  Pagination,
}: TypeTheAnswerTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Base Form</TableCell>
            <TableCell>Answer</TableCell>
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
              <TableCell>{item.baseForm}</TableCell>
              <TableCell>{item.answer}</TableCell>
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
