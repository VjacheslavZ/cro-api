import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DictionaryCollection } from '@cro/shared';

import '../../../i18n';
import { DictionaryBatchActions } from './DictionaryBatchActions';

const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('@/api/dictionary.ts', () => ({
  useBatchAssignCollection: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const collections = [
  { id: 'c1', name: 'Food', type: 'personal' },
  { id: 'c2', name: 'Travel', type: 'personal' },
] as DictionaryCollection[];

describe('DictionaryBatchActions', () => {
  beforeEach(() => mockMutateAsync.mockClear());

  it('renders nothing when no words are selected', () => {
    const { container } = render(
      <DictionaryBatchActions
        selectedIds={new Set()}
        collections={collections}
        onDone={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the selected count', () => {
    render(
      <DictionaryBatchActions
        selectedIds={new Set(['w1', 'w2'])}
        collections={collections}
        onDone={jest.fn()}
      />,
    );
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('assigns selected words to the chosen collection and calls onDone', async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    render(
      <DictionaryBatchActions
        selectedIds={new Set(['w1', 'w2'])}
        collections={collections}
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Assign to Collection' }));
    await user.click(await screen.findByRole('option', { name: 'Travel' }));
    await user.click(screen.getByRole('button', { name: 'Assign to Collection' }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({ wordIds: ['w1', 'w2'], collectionId: 'c2' }),
    );
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sends collectionId: null when no collection is chosen', async () => {
    const user = userEvent.setup();
    render(
      <DictionaryBatchActions
        selectedIds={new Set(['w1'])}
        collections={collections}
        onDone={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Assign to Collection' }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({ wordIds: ['w1'], collectionId: null }),
    );
  });

  it('cancel calls onDone without mutating', async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    render(
      <DictionaryBatchActions
        selectedIds={new Set(['w1'])}
        collections={collections}
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
