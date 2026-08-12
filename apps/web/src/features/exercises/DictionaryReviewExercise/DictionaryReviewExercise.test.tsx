import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FsrsRating } from '@cro/shared';
import type { DictionaryReviewItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { DictionaryReviewExercise } from './DictionaryReviewExercise';

const item: DictionaryReviewItem = {
  wordId: 'word1',
  wordHr: 'kruh',
  translation: 'bread',
  intervals: {
    again: 0.5,
    hard: 1,
    good: 3,
    easy: 7,
  },
};

describe('DictionaryReviewExercise', () => {
  it('shows the word but hides the translation and ratings before revealing', () => {
    renderWithProviders(
      <DictionaryReviewExercise
        item={item}
        revealed={false}
        onReveal={jest.fn()}
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByText('kruh')).toBeInTheDocument();
    expect(screen.queryByText('bread')).not.toBeInTheDocument();
    expect(screen.queryByText('Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Hard')).not.toBeInTheDocument();
    expect(screen.queryByText('Good')).not.toBeInTheDocument();
    expect(screen.queryByText('Easy')).not.toBeInTheDocument();
  });

  it('calls onReveal when the card is tapped', async () => {
    const onReveal = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DictionaryReviewExercise
        item={item}
        revealed={false}
        onReveal={onReveal}
        onAnswer={jest.fn()}
      />,
    );

    await user.click(screen.getByText('kruh'));

    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('reveals the translation and the 4 rating buttons once revealed', () => {
    renderWithProviders(
      <DictionaryReviewExercise item={item} revealed onReveal={jest.fn()} onAnswer={jest.fn()} />,
    );

    expect(screen.getByText('bread')).toBeInTheDocument();
    expect(screen.getByText('Again')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('calls onAnswer with { wordId, rating } for each rating button', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DictionaryReviewExercise item={item} revealed onReveal={jest.fn()} onAnswer={onAnswer} />,
    );

    await user.click(screen.getByText('Again'));
    expect(onAnswer).toHaveBeenLastCalledWith({ wordId: 'word1', rating: FsrsRating.AGAIN });

    await user.click(screen.getByText('Hard'));
    expect(onAnswer).toHaveBeenLastCalledWith({ wordId: 'word1', rating: FsrsRating.HARD });

    await user.click(screen.getByText('Good'));
    expect(onAnswer).toHaveBeenLastCalledWith({ wordId: 'word1', rating: FsrsRating.GOOD });

    await user.click(screen.getByText('Easy'));
    expect(onAnswer).toHaveBeenLastCalledWith({ wordId: 'word1', rating: FsrsRating.EASY });

    expect(onAnswer).toHaveBeenCalledTimes(4);
  });

  it('renders the predicted interval text for each rating', () => {
    renderWithProviders(
      <DictionaryReviewExercise item={item} revealed onReveal={jest.fn()} onAnswer={jest.fn()} />,
    );

    expect(screen.getByText('< 1 min')).toBeInTheDocument();
    expect(screen.getByText('1 day')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
  });
});
