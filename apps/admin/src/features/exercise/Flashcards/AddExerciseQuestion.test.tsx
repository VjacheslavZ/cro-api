import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { AddExerciseQuestion } from './AddExerciseQuestion';
import type { FlashcardItem } from './AddExerciseQuestion';

describe('AddExerciseQuestion (Flashcards)', () => {
  it('renders empty fields in create mode', () => {
    renderWithProviders(
      <AddExerciseQuestion editing={null} isPending={false} onSubmit={jest.fn()} />,
    );

    expect(screen.getByLabelText('Front Text (HR)')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddExerciseQuestion editing={null} isPending={false} onSubmit={jest.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
  });

  it('submits validated form data via onSubmit', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AddExerciseQuestion editing={null} isPending={false} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText('Front Text (HR)'), 'macka');
    await user.type(screen.getByLabelText('Translation (RU)'), 'кошка');
    await user.type(screen.getByLabelText('Translation (UK)'), 'кішка');
    await user.type(screen.getByLabelText('Translation (EN)'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        frontText: 'macka',
        translationRu: 'кошка',
        translationUk: 'кішка',
        translationEn: 'cat',
        sortOrder: 0,
      }),
    );
  });

  it('pre-fills fields in edit mode and shows the Update button', () => {
    const editing: FlashcardItem = {
      id: 'f1',
      frontText: 'macka',
      translationRu: 'кошка',
      translationUk: 'кішка',
      translationEn: 'cat',
      sortOrder: 3,
    };

    renderWithProviders(
      <AddExerciseQuestion editing={editing} isPending={false} onSubmit={jest.fn()} />,
    );

    expect(screen.getByLabelText('Front Text (HR)')).toHaveValue('macka');
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('disables the submit button while isPending is true', () => {
    renderWithProviders(<AddExerciseQuestion editing={null} isPending onSubmit={jest.fn()} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
