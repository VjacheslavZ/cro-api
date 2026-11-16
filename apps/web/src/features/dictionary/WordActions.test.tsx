import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NativeLanguage, type DictionaryWord } from '@cro/shared';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { speakWord } from '../../shared/lib/speech';
import { WordActionsMenu } from './WordActions';

jest.mock('../../shared/lib/speech', () => ({ speakWord: jest.fn() }));

const baseWord: DictionaryWord = {
  id: 'w1',
  wordHr: 'kruh',
  translation: 'bread',
  translationLanguage: NativeLanguage.EN,
  collectionId: null,
  collectionName: null,
  progressPercent: 40,
  wordToTranslatePercent: 40,
  translateToWordPercent: 40,
  letterPickPercent: 40,
  matchingPercent: 40,
  isLearned: false,
  createdAt: '2026-11-16T00:00:00.000Z',
};

function renderMenu(word: Partial<DictionaryWord> = {}) {
  const handlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onMarkLearned: jest.fn(),
    onResetProgress: jest.fn(),
  };
  renderWithProviders(<WordActionsMenu word={{ ...baseWord, ...word }} {...handlers} />);
  return handlers;
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  return screen.findByRole('dialog');
}

describe('WordActionsMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows all five actions in the popover', async () => {
    const user = userEvent.setup();
    renderMenu();

    const popover = await openMenu(user);

    expect(
      within(popover)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Mark as learned', 'Reset progress', 'Edit Word', 'Listen', 'Delete']);
  });

  it('hides actions that do not apply instead of leaving gaps', async () => {
    const user = userEvent.setup();
    renderMenu({ isLearned: true, progressPercent: 0 });

    const popover = await openMenu(user);

    expect(within(popover).getByRole('button', { name: 'Mark as learned' })).toHaveClass('hidden');
    expect(within(popover).getByRole('button', { name: 'Reset progress' })).toHaveClass('hidden');
  });

  it('runs an action with the word and closes the popover', async () => {
    const user = userEvent.setup();
    const handlers = renderMenu();

    const popover = await openMenu(user);
    await user.click(within(popover).getByRole('button', { name: 'Delete' }));

    expect(handlers.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'w1' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the popover open after Listen so the word can be replayed', async () => {
    const user = userEvent.setup();
    renderMenu();

    const popover = await openMenu(user);
    await user.click(within(popover).getByRole('button', { name: 'Listen' }));

    expect(speakWord).toHaveBeenCalledWith('kruh');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
