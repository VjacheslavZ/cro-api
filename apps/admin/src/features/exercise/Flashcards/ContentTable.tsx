/**
 * @module Flashcards/ContentTable
 * @description Pure display table for Flashcard items. Columns: frontText (Croatian), translations
 * (EN/UK/RU), sortOrder, and edit/delete actions. Pagination injected as a render-prop component
 * from Flashcards via useTablePagination.
 * @usedBy Flashcards
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

import type { FlashcardItem } from './AddExerciseQuestion.tsx';

interface FlashcardTableProps {
  items: FlashcardItem[];
  onEdit: (item: FlashcardItem) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  Pagination: () => React.JSX.Element;
}

/**
 * Renders the Flashcard items table with edit and delete actions.
 * @param props.items - Paginated slice of flashcard items for the current page.
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
}: FlashcardTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Front Text</TableCell>
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
              <TableCell>{item.frontText}</TableCell>
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
