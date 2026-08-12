import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TypeTheAnswerItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { TypeTheAnswerExercise } from './TypeTheAnswerExercise';

const item: TypeTheAnswerItem = {
  id: 'item1',
  topicId: 'topic1',
  baseForm: 'kruh',
  answer: 'kruhovi',
  translationRu: 'хлеба',
  translationUk: 'хліба',
  translationEn: 'breads',
  sortOrder: 0,
};

describe('TypeTheAnswerExercise', () => {
  it('renders the base form and the input field', () => {
    renderWithProviders(<TypeTheAnswerExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    expect(screen.getByText('kruh')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter plural form...')).toBeInTheDocument();
  });

  it('shows the translation for the default (English) native language', () => {
    renderWithProviders(<TypeTheAnswerExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    expect(screen.getByText('(breads)')).toBeInTheDocument();
  });

  it("shows the translation for the user's native language", () => {
    renderWithProviders(<TypeTheAnswerExercise item={item} onAnswer={jest.fn()} isLast={false} />, {
      auth: {
        loading: false,
        user: {
          id: 'user1',
          email: 'a@b.com',
          name: 'A',
          avatarUrl: null,
          role: 'STUDENT',
          nativeLanguage: 'RU',
          xpTotal: 0,
          currentStreak: 0,
        },
      },
    });

    expect(screen.getByText('(хлеба)')).toBeInTheDocument();
  });

  it('accepts the correct answer and shows the correct message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TypeTheAnswerExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    await user.type(screen.getByPlaceholderText('Enter plural form...'), 'kruhovi');

    expect(await screen.findByText('Correct!')).toBeInTheDocument();
  });

  it('rejects a wrong answer and shows the incorrect message with the correct answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TypeTheAnswerExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    await user.type(screen.getByPlaceholderText('Enter plural form...'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText('Incorrect. The correct answer is: kruhovi')).toBeInTheDocument();
  });
});
