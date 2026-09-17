import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import '../../i18n';
import { SessionResultsPage } from './SessionResultsPage';

function renderWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/exercises/results/s1', state }]}>
      <SessionResultsPage />
    </MemoryRouter>,
  );
}

describe('SessionResultsPage', () => {
  it('shows score, XP and streak from router state', () => {
    renderWithState({
      correctAnswers: 7,
      totalQuestions: 10,
      xpEarned: 35,
      currentStreak: 3,
      topicId: 't1',
      exerciseType: 'FILL_IN_BLANK',
    });

    expect(screen.getByRole('heading', { name: 'Session Complete!' })).toBeInTheDocument();
    expect(screen.getByText('Score: 7 / 10')).toBeInTheDocument();
    expect(screen.getByText('+35 XP')).toBeInTheDocument();
    expect(screen.getByText('Current streak: 3 days')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue practicing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose another exercise' })).toBeInTheDocument();
  });

  it('hides "Continue" when topic info is missing and falls back to an error without state', () => {
    renderWithState({ correctAnswers: 1, totalQuestions: 1, xpEarned: 5, currentStreak: 1 });
    expect(screen.queryByRole('button', { name: 'Continue practicing' })).not.toBeInTheDocument();

    renderWithState(null);
    expect(screen.getAllByRole('button', { name: 'Choose another exercise' })).toHaveLength(2);
  });
});
