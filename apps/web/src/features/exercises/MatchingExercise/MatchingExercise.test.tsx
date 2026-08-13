import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DictionaryPracticeItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { MatchingExercise } from './MatchingExercise';

const items: DictionaryPracticeItem[] = [
  { wordId: 'w1', wordHr: 'kruh', translation: 'bread' },
  { wordId: 'w2', wordHr: 'mlijeko', translation: 'milk' },
];

describe('MatchingExercise', () => {
  it('renders masked left-column words and the shuffled translations', () => {
    renderWithProviders(<MatchingExercise items={items} onComplete={jest.fn()} />);

    expect(screen.getAllByText('*************')).toHaveLength(2);
    expect(screen.getByText('bread')).toBeInTheDocument();
    expect(screen.getByText('milk')).toBeInTheDocument();
    expect(screen.getByText('0 / 2 matched')).toBeInTheDocument();
  });

  it('reveals the Croatian word when a correct pair is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MatchingExercise items={items} onComplete={jest.fn()} />);

    await user.click(screen.getAllByText('*************')[0]);
    await user.click(screen.getByText('bread'));

    expect(screen.getByText('kruh')).toBeInTheDocument();
    expect(screen.getByText('1 / 2 matched')).toBeInTheDocument();
  });

  it('flashes an error and keeps the word unmatched when the wrong translation is picked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MatchingExercise items={items} onComplete={jest.fn()} />);

    await user.click(screen.getAllByText('*************')[0]);
    await user.click(screen.getByText('milk'));

    expect(screen.getAllByText('*************')).toHaveLength(2);
    expect(screen.getByText('0 / 2 matched')).toBeInTheDocument();
  });

  it('marks isCorrect=false for a word matched after a prior wrong attempt', async () => {
    const onComplete = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<MatchingExercise items={items} onComplete={onComplete} />);

    // Wrong attempt for w1, then correct match for w1
    await user.click(screen.getAllByText('*************')[0]);
    await user.click(screen.getByText('milk'));
    await user.click(screen.getAllByText('*************')[0]);
    await user.click(screen.getByText('bread'));

    // Correct match for w2 without any errors
    await user.click(screen.getByText('*************'));
    await user.click(screen.getByText('milk'));

    expect(onComplete).toHaveBeenCalledWith([
      { wordId: 'w1', givenAnswer: 'bread', isCorrect: false },
      { wordId: 'w2', givenAnswer: 'milk', isCorrect: true },
    ]);
  });

  it('shows the completion message once all pairs are matched', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MatchingExercise items={items} onComplete={jest.fn()} />);

    await user.click(screen.getAllByText('*************')[0]);
    await user.click(screen.getByText('bread'));
    await user.click(screen.getByText('*************'));
    await user.click(screen.getByText('milk'));

    expect(screen.getByText('All words matched!')).toBeInTheDocument();
    expect(screen.getByText('2 / 2 matched')).toBeInTheDocument();
  });
});
