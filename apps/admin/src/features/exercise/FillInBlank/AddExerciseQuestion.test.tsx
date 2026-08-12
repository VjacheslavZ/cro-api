import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { AddExerciseQuestion } from './AddExerciseQuestion';
import type { FillInBlankItem } from './AddExerciseQuestion';

describe('AddExerciseQuestion (Fill in the Blank)', () => {
  it('renders empty fields in create mode', () => {
    renderWithProviders(
      <AddExerciseQuestion editing={null} isPending={false} onSubmit={jest.fn()} />,
    );

    expect(screen.getByLabelText(/Sentence \(HR\)/)).toHaveValue('');
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

    await user.click(screen.getByLabelText(/Sentence \(HR\)/));
    await user.paste('Ja {{BLANK}} kavu.');
    await user.type(screen.getByLabelText('Blank Answer'), 'pijem');
    await user.type(screen.getByLabelText('Translation (RU)'), 'Я пью кофе.');
    await user.type(screen.getByLabelText('Translation (UK)'), 'Я п’ю каву.');
    await user.type(screen.getByLabelText('Translation (EN)'), 'I drink coffee.');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        sentenceHr: 'Ja {{BLANK}} kavu.',
        blankAnswer: 'pijem',
        translationRu: 'Я пью кофе.',
        translationUk: 'Я п’ю каву.',
        translationEn: 'I drink coffee.',
        sortOrder: 0,
      }),
    );
  });

  it('pre-fills fields in edit mode and shows the Update button', () => {
    const editing: FillInBlankItem = {
      id: 'b1',
      sentenceHr: 'Ja {{BLANK}} kavu.',
      blankAnswer: 'pijem',
      translationRu: 'Я пью кофе.',
      translationUk: 'Я п’ю каву.',
      translationEn: 'I drink coffee.',
      sortOrder: 4,
    };

    renderWithProviders(
      <AddExerciseQuestion editing={editing} isPending={false} onSubmit={jest.fn()} />,
    );

    expect(screen.getByLabelText(/Sentence \(HR\)/)).toHaveValue('Ja {{BLANK}} kavu.');
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('disables the submit button while isPending is true', () => {
    renderWithProviders(<AddExerciseQuestion editing={null} isPending onSubmit={jest.fn()} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
