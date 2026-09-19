import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DictionaryWord } from '@cro/shared';

import '../../../i18n';
import { DeleteWordDialog } from './DeleteWordDialog';

const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('@/api/dictionary.ts', () => ({
  useDeleteWord: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const word = { id: 'w1', wordHr: 'kuća' } as DictionaryWord;

describe('DeleteWordDialog', () => {
  beforeEach(() => mockMutateAsync.mockClear());

  it('is closed when word is null', () => {
    render(<DeleteWordDialog word={null} onDeleted={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows the word being deleted', () => {
    render(<DeleteWordDialog word={word} onDeleted={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByRole('alertdialog', { name: 'Delete word' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "kuća"?')).toBeInTheDocument();
  });

  it('deletes the word, then calls onDeleted and onClose', async () => {
    const user = userEvent.setup();
    const onDeleted = jest.fn();
    const onClose = jest.fn();
    render(<DeleteWordDialog word={word} onDeleted={onDeleted} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('w1'));
    expect(onDeleted).toHaveBeenCalledWith('w1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancel closes without deleting', async () => {
    const user = userEvent.setup();
    const onDeleted = jest.fn();
    const onClose = jest.fn();
    render(<DeleteWordDialog word={word} onDeleted={onDeleted} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDeleted).not.toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
