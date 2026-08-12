import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { WordProgressRow } from './WordProgressRow';

const sortedWords = [{ wordHr: 'Ja' }, { wordHr: 'jedem' }, { wordHr: 'kruh' }];

describe('WordProgressRow', () => {
  it('renders a chip per selected word while selecting', () => {
    renderWithProviders(
      <WordProgressRow
        phase="selecting"
        selectedWords={['Ja', 'jedem']}
        sortedWords={sortedWords}
        onUndo={jest.fn()}
      />,
    );

    expect(screen.getByText('Ja')).toBeInTheDocument();
    expect(screen.getByText('jedem')).toBeInTheDocument();
    expect(screen.queryByText('kruh')).not.toBeInTheDocument();
  });

  it('calls onUndo when the last chip is deleted', async () => {
    const onUndo = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <WordProgressRow
        phase="selecting"
        selectedWords={['Ja', 'jedem']}
        sortedWords={sortedWords}
        onUndo={onUndo}
      />,
    );

    const lastChip = screen.getByText('jedem').closest('.MuiChip-root');
    const deleteIcon = lastChip!.querySelector('.MuiChip-deleteIcon');
    await user.click(deleteIcon!);

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('shows the correct word above a wrong chip once the phase is incorrect', () => {
    renderWithProviders(
      <WordProgressRow
        phase="incorrect"
        selectedWords={['Ti', 'jedem', 'kruh']}
        sortedWords={sortedWords}
        onUndo={jest.fn()}
      />,
    );

    // Wrong first slot: the chosen word is shown, and the correct word is shown above it.
    expect(screen.getByText('Ti')).toBeInTheDocument();
    expect(screen.getByText('Ja')).toBeInTheDocument();
    // Correct slots don't repeat the correct word as a separate caption.
    expect(screen.getAllByText('jedem')).toHaveLength(1);
    expect(screen.getAllByText('kruh')).toHaveLength(1);
  });
});
