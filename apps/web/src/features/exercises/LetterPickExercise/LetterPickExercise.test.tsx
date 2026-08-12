import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PoolLetter } from './helpers';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { LetterPickExercise } from './LetterPickExercise';

// Deterministic, unshuffled pool: the word's own letters plus one distractor 'z',
// so tests can reliably target "the correct next letter" vs. "a wrong letter".
jest.mock('./helpers', () => ({
  buildPool: (wordHr: string): PoolLetter[] => [
    ...wordHr
      .toLowerCase()
      .split('')
      .map((char, idx) => ({ id: idx, char, used: false })),
    { id: 999, char: 'z', used: false },
  ],
}));

describe('LetterPickExercise', () => {
  it('shows the translation prompt and empty slots initially', () => {
    renderWithProviders(
      <LetterPickExercise itemId="item1" wordHr="kruh" translation="bread" onAnswer={jest.fn()} />,
    );

    expect(screen.getByText('bread')).toBeInTheDocument();
    expect(screen.getByText('Build the Croatian word:')).toBeInTheDocument();
    expect(screen.queryByText('Perfect! No mistakes!')).not.toBeInTheDocument();
  });

  it('completes the word without errors when letters are tapped in order', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LetterPickExercise itemId="item1" wordHr="kruh" translation="bread" onAnswer={jest.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'K' }));
    await user.click(screen.getByRole('button', { name: 'R' }));
    await user.click(screen.getByRole('button', { name: 'U' }));
    await user.click(screen.getByRole('button', { name: 'H' }));

    expect(screen.getByText('Perfect! No mistakes!')).toBeInTheDocument();
  });

  it('marks a wrong-letter tap as an error and shows the "with errors" state after completion', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LetterPickExercise itemId="item1" wordHr="kruh" translation="bread" onAnswer={jest.fn()} />,
    );

    // 'z' is not the expected first letter ('k') — should not place a letter, just flash an error.
    await user.click(screen.getByRole('button', { name: 'Z' }));
    await user.click(screen.getByRole('button', { name: 'K' }));
    await user.click(screen.getByRole('button', { name: 'R' }));
    await user.click(screen.getByRole('button', { name: 'U' }));
    await user.click(screen.getByRole('button', { name: 'H' }));

    expect(screen.getByText('Completed with errors')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });

  it('reports isCorrect=false and the original word via onAnswer after an errored completion', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <LetterPickExercise itemId="item1" wordHr="kruh" translation="bread" onAnswer={onAnswer} />,
    );

    await user.click(screen.getByRole('button', { name: 'Z' }));
    await user.click(screen.getByRole('button', { name: 'K' }));
    await user.click(screen.getByRole('button', { name: 'R' }));
    await user.click(screen.getByRole('button', { name: 'U' }));
    await user.click(screen.getByRole('button', { name: 'H' }));

    await user.click(screen.getByRole('button', { name: /Next/i }));

    expect(onAnswer).toHaveBeenCalledWith({
      itemId: 'item1',
      givenAnswer: 'kruh',
      isCorrect: false,
    });
  });

  it('resets placed letters back to the pool when Reset is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LetterPickExercise itemId="item1" wordHr="kruh" translation="bread" onAnswer={jest.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'K' }));
    expect(screen.getByText('Reset')).toBeInTheDocument();

    await user.click(screen.getByText('Reset'));

    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'K' })).toBeInTheDocument();
  });

  it('renders the ExerciseProgressHeader with progress info and wires the stop button', async () => {
    const onStop = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <LetterPickExercise
        itemId="item1"
        wordHr="kruh"
        translation="bread"
        onAnswer={jest.fn()}
        progress={{ currentIndex: 1, total: 5, onStop }}
      />,
    );

    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    await user.click(screen.getByText('Stop'));
    expect(onStop).toHaveBeenCalled();
  });
});
