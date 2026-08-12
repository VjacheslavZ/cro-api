import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FlashcardItem } from '@cro/shared';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { FlashcardExercise } from './FlashcardExercise';

const item: FlashcardItem = {
  id: 'item1',
  topicId: 'topic1',
  frontText: 'kruh',
  translationRu: 'хлеб',
  translationUk: 'хліб',
  translationEn: 'bread',
  sortOrder: 0,
};

describe('FlashcardExercise', () => {
  it('shows the front text and hides the translation before flipping', () => {
    renderWithProviders(<FlashcardExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    expect(screen.getByText('kruh')).toBeInTheDocument();
    expect(screen.queryByText('bread')).not.toBeInTheDocument();
    expect(screen.queryByText('I knew it')).not.toBeInTheDocument();
  });

  it('reveals the translation and self-report buttons after tapping the card', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FlashcardExercise item={item} onAnswer={jest.fn()} isLast={false} />);

    await user.click(screen.getByText('kruh'));

    expect(screen.getByText('bread')).toBeInTheDocument();
    expect(screen.getByText('I knew it')).toBeInTheDocument();
    expect(screen.getByText("I didn't know")).toBeInTheDocument();
  });

  it('reports isCorrect=true when "I knew it" is clicked', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<FlashcardExercise item={item} onAnswer={onAnswer} isLast={false} />);

    await user.click(screen.getByText('kruh'));
    await user.click(screen.getByText('I knew it'));

    expect(onAnswer).toHaveBeenCalledWith({
      itemId: 'item1',
      givenAnswer: 'KNOWN',
      isCorrect: true,
    });
  });

  it('reports isCorrect=false when "I didn\'t know" is clicked', async () => {
    const onAnswer = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<FlashcardExercise item={item} onAnswer={onAnswer} isLast={false} />);

    await user.click(screen.getByText('kruh'));
    await user.click(screen.getByText("I didn't know"));

    expect(onAnswer).toHaveBeenCalledWith({
      itemId: 'item1',
      givenAnswer: 'UNKNOWN',
      isCorrect: false,
    });
  });

  it("picks the translation for the user's native language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FlashcardExercise item={item} onAnswer={jest.fn()} isLast={false} />, {
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

    await user.click(screen.getByText('kruh'));

    expect(screen.getByText('хлеб')).toBeInTheDocument();
  });
});
