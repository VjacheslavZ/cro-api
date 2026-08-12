import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DictionaryPracticeItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { SpeedQuizCard } from './SpeedQuizCard';

const item: DictionaryPracticeItem = { wordId: 'w1', wordHr: 'kruh', translation: 'bread' };
const options = ['bread', 'milk', 'water'];

describe('SpeedQuizCard', () => {
  it('renders the Croatian word, timer, and enabled answer options during the answering phase', () => {
    renderWithProviders(
      <SpeedQuizCard
        item={item}
        options={options}
        phase="answering"
        selectedAnswer={null}
        timeLeft={5}
        timerColor="primary.main"
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByText('kruh')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    options.forEach((opt) => {
      expect(screen.getByRole('button', { name: opt })).toBeEnabled();
    });
  });

  it('calls onAnswer with the picked option when clicked during the answering phase', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SpeedQuizCard
        item={item}
        options={options}
        phase="answering"
        selectedAnswer={null}
        timeLeft={5}
        timerColor="primary.main"
        onAnswer={onAnswer}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'milk' }));

    expect(onAnswer).toHaveBeenCalledWith('milk');
  });

  it('disables all options and highlights the correct answer in the result phase', () => {
    renderWithProviders(
      <SpeedQuizCard
        item={item}
        options={options}
        phase="result"
        selectedAnswer="milk"
        timeLeft={0}
        timerColor="error.main"
        onAnswer={jest.fn()}
      />,
    );

    options.forEach((opt) => {
      expect(screen.getByRole('button', { name: opt })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'bread' })).toHaveStyle({
      backgroundColor: '#e8f5e9',
    });
  });

  it('highlights the wrong selected answer differently from the correct one in the result phase', () => {
    renderWithProviders(
      <SpeedQuizCard
        item={item}
        options={options}
        phase="result"
        selectedAnswer="milk"
        timeLeft={0}
        timerColor="error.main"
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'milk' })).toHaveStyle({
      backgroundColor: '#ffebee',
    });
  });

  it('does not highlight any option as wrong when the correct answer was selected', () => {
    renderWithProviders(
      <SpeedQuizCard
        item={item}
        options={options}
        phase="result"
        selectedAnswer="bread"
        timeLeft={0}
        timerColor="error.main"
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'bread' })).toHaveStyle({
      backgroundColor: '#e8f5e9',
    });
    expect(screen.getByRole('button', { name: 'milk' })).not.toHaveStyle({
      backgroundColor: '#ffebee',
    });
  });
});
