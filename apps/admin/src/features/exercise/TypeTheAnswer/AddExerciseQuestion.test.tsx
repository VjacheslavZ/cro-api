import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { AddExerciseQuestion } from './AddExerciseQuestion';
import type { TypeTheAnswerItem } from './AddExerciseQuestion';
import { apiClient } from '../../../api/client';

jest.mock('../../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AddExerciseQuestion (Type the Answer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({ data: [] });
  });

  it('renders empty fields in create mode', () => {
    renderWithProviders(
      <AddExerciseQuestion
        topicId="topic1"
        editing={null}
        isPending={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Base Form')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddExerciseQuestion
        topicId="topic1"
        editing={null}
        isPending={false}
        onSubmit={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
  });

  it('submits validated form data via onSubmit', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AddExerciseQuestion topicId="topic1" editing={null} isPending={false} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText('Base Form'), 'piti');
    await user.type(screen.getByLabelText('Answer'), 'pijem');
    await user.type(screen.getByLabelText('Translation (RU)'), 'пить');
    await user.type(screen.getByLabelText('Translation (UK)'), 'пити');
    await user.type(screen.getByLabelText('Translation (EN)'), 'to drink');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        baseForm: 'piti',
        answer: 'pijem',
        translationRu: 'пить',
        translationUk: 'пити',
        translationEn: 'to drink',
        sortOrder: 0,
      }),
    );
  });

  it('shows a duplicate error when baseForm already exists among the topic items', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: [{ id: 'other', baseForm: 'piti', answer: 'pijem', sortOrder: 0 }],
    });
    const user = userEvent.setup();
    renderWithProviders(
      <AddExerciseQuestion
        topicId="topic1"
        editing={null}
        isPending={false}
        onSubmit={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Base Form'), 'piti');
    await user.tab();

    expect(await screen.findByText('This word already exists')).toBeInTheDocument();
    expect(mockedApiClient.get).toHaveBeenCalledWith('/admin/topics/topic1/type-the-answer-items');
  });

  it('pre-fills fields in edit mode and shows the Update button', () => {
    const editing: TypeTheAnswerItem = {
      id: 'q1',
      baseForm: 'piti',
      answer: 'pijem',
      translationRu: 'пить',
      translationUk: 'пити',
      translationEn: 'to drink',
      sortOrder: 5,
    };

    renderWithProviders(
      <AddExerciseQuestion
        topicId="topic1"
        editing={editing}
        isPending={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Base Form')).toHaveValue('piti');
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('disables the submit button while isPending is true', () => {
    renderWithProviders(
      <AddExerciseQuestion topicId="topic1" editing={null} isPending onSubmit={jest.fn()} />,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
