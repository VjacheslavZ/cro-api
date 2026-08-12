import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FillInBlankItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { FillInBlankExercise } from './FillInBlankExercise';

const item: FillInBlankItem = {
  id: 'item1',
  topicId: 'topic1',
  sentenceHr: 'Ja jedem {{BLANK}}.',
  blankAnswer: 'kruh',
  translationRu: 'Я ем хлеб.',
  translationUk: 'Я їм хліб.',
  translationEn: 'I eat bread.',
  sortOrder: 0,
};

describe('FillInBlankExercise', () => {
  it('renders the sentence with the blank replaced by underscores and the input field', () => {
    renderWithProviders(<FillInBlankExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    expect(screen.getByText('Ja jedem ______.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter the missing word...')).toBeInTheDocument();
  });

  it('shows the translation for the default (English) native language', () => {
    renderWithProviders(<FillInBlankExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    expect(screen.getByText('I eat bread.')).toBeInTheDocument();
  });

  it("shows the translation for the user's native language", () => {
    renderWithProviders(<FillInBlankExercise item={item} onAnswer={jest.fn()} isLast={false} />, {
      auth: {
        loading: false,
        user: {
          id: 'user1',
          email: 'a@b.com',
          name: 'A',
          avatarUrl: null,
          role: 'STUDENT',
          nativeLanguage: 'UK',
          xpTotal: 0,
          currentStreak: 0,
        },
      },
    });

    expect(screen.getByText('Я їм хліб.')).toBeInTheDocument();
  });

  it('accepts the correct answer and shows the correct message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FillInBlankExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    await user.type(screen.getByPlaceholderText('Enter the missing word...'), 'kruh');

    expect(await screen.findByText('Correct!')).toBeInTheDocument();
  });

  it('rejects a wrong answer and shows the incorrect message with the correct answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FillInBlankExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    await user.type(screen.getByPlaceholderText('Enter the missing word...'), 'mlijeko');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText('Incorrect. The correct answer is: kruh')).toBeInTheDocument();
  });
});
