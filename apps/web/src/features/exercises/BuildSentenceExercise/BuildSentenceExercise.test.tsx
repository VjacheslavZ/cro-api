import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BuildSentenceItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { BuildSentenceExercise } from './BuildSentenceExercise';

const item: BuildSentenceItem = {
  id: 'item1',
  topicId: 'topic1',
  translationRu: 'Я ем хлеб',
  translationUk: 'Я їм хліб',
  translationEn: 'I eat bread',
  sortOrder: 0,
  words: [
    { id: 'w1', wordHr: 'Ja', position: 0, options: ['Ja', 'Ti', 'On'] },
    { id: 'w2', wordHr: 'jedem', position: 1, options: ['jedem', 'jedeš', 'jede'] },
    { id: 'w3', wordHr: 'kruh', position: 2, options: ['kruh', 'mlijeko', 'vodu'] },
  ],
};

describe('BuildSentenceExercise', () => {
  it('shows the instruction, translation, and first word options', () => {
    renderWithProviders(<BuildSentenceExercise item={item} onAnswer={jest.fn()} />);

    expect(screen.getByText('Build the Croatian sentence:')).toBeInTheDocument();
    expect(screen.getByText('I eat bread')).toBeInTheDocument();
    expect(screen.getByText('Word 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Ja')).toBeInTheDocument();
    expect(screen.getByText('Ti')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('adds a chip and advances to the next word when an option is tapped', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuildSentenceExercise item={item} onAnswer={jest.fn()} />);

    await user.click(screen.getByText('Ja'));

    expect(screen.getByText('Word 2 of 3')).toBeInTheDocument();
    // The tapped word now appears both as a progress chip and (possibly) an option
    // for the next slot, so assert via getAllByText.
    expect(screen.getAllByText('Ja').length).toBeGreaterThanOrEqual(1);
  });

  it('removes the undo icon target when the last chip is deleted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuildSentenceExercise item={item} onAnswer={jest.fn()} />);

    await user.click(screen.getByText('Ja'));
    expect(screen.getByText('Word 2 of 3')).toBeInTheDocument();

    const chip = screen.getByText('Ja').closest('.MuiChip-root');
    expect(chip).not.toBeNull();
    const deleteIcon = chip!.querySelector('.MuiChip-deleteIcon');
    expect(deleteIcon).not.toBeNull();

    await user.click(deleteIcon!);

    expect(screen.getByText('Word 1 of 3')).toBeInTheDocument();
  });

  it('shows a success banner and reports isCorrect=true after a fully correct sequence', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<BuildSentenceExercise item={item} onAnswer={onAnswer} />);

    await user.click(screen.getByText('Ja'));
    await user.click(screen.getByText('jedem'));
    await user.click(screen.getByText('kruh'));

    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.queryByText('Word 1 of 3')).not.toBeInTheDocument();
    // onAnswer only fires after the auto-advance delay, not immediately.
    expect(onAnswer).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(onAnswer).toHaveBeenCalledWith({
          itemId: 'item1',
          givenAnswer: 'Ja jedem kruh',
          isCorrect: true,
        });
      },
      { timeout: 2500 },
    );
  });

  it('shows an error banner with the correct sentence and does not auto-advance on a wrong sequence', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<BuildSentenceExercise item={item} onAnswer={onAnswer} />);

    await user.click(screen.getByText('Ti'));
    await user.click(screen.getByText('jedeš'));
    await user.click(screen.getByText('kruh'));

    expect(screen.getByText('Almost! Here is the correct sentence:')).toBeInTheDocument();
    expect(screen.getByText('Ja jedem kruh')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('resets the selection when "Try Again" is clicked after a wrong sequence', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuildSentenceExercise item={item} onAnswer={jest.fn()} />);

    await user.click(screen.getByText('Ti'));
    await user.click(screen.getByText('jedeš'));
    await user.click(screen.getByText('vodu'));

    expect(screen.getByText('Try Again')).toBeInTheDocument();

    await user.click(screen.getByText('Try Again'));

    expect(screen.getByText('Word 1 of 3')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});
