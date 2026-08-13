import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lesson } from '@cro/shared';
import { LessonItemType } from '@cro/shared';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { CreateLessonForm } from './CreateLessonForm';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const existingLesson: Lesson = {
  id: 'lesson1',
  titleHr: 'Naslov',
  titleRu: 'Заголовок',
  titleUk: 'Заголовок',
  titleEn: 'Title',
  descriptionHr: 'Opis',
  descriptionRu: 'Описание',
  descriptionUk: 'Опис',
  descriptionEn: 'Description',
  sortOrder: 3,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  items: [
    {
      id: 'item1',
      lessonId: 'lesson1',
      itemType: LessonItemType.EXERCISE_TOPIC,
      itemId: 'topic1',
      itemName: 'Verbs',
      sortOrder: 0,
    },
  ],
};

describe('CreateLessonForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty fields in create mode', () => {
    renderWithProviders(<CreateLessonForm lesson={null} onDone={jest.fn()} />);

    expect(screen.getByLabelText(/Title \(EN\)/)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create Lesson' })).toBeInTheDocument();
    expect(screen.queryByText('Lesson Items')).not.toBeInTheDocument();
  });

  it('shows validation errors when required title fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateLessonForm lesson={null} onDone={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create Lesson' }));

    expect(await screen.findByText('Title (HR) is required')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('submits the form and calls POST /admin/lessons', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 'lesson1' } });
    const user = userEvent.setup();
    renderWithProviders(<CreateLessonForm lesson={null} onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/Title \(HR\)/), 'Naslov');
    await user.type(screen.getByLabelText(/Title \(EN\)/), 'Title');
    await user.type(screen.getByLabelText(/Title \(UK\)/), 'Заголовок');
    await user.type(screen.getByLabelText(/Title \(RU\)/), 'Заголовок');
    await user.click(screen.getByRole('button', { name: 'Create Lesson' }));

    await waitFor(() => expect(mockedApiClient.post).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/admin/lessons',
      expect.objectContaining({ titleHr: 'Naslov', titleEn: 'Title' }),
    );
    expect(await screen.findByText('Lesson created successfully')).toBeInTheDocument();
  });

  it('shows the server error message when the request fails', async () => {
    mockedApiClient.post.mockRejectedValueOnce({
      response: { data: { message: 'Title already exists' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<CreateLessonForm lesson={null} onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/Title \(HR\)/), 'Naslov');
    await user.type(screen.getByLabelText(/Title \(EN\)/), 'Title');
    await user.type(screen.getByLabelText(/Title \(UK\)/), 'Заголовок');
    await user.type(screen.getByLabelText(/Title \(RU\)/), 'Заголовок');
    await user.click(screen.getByRole('button', { name: 'Create Lesson' }));

    expect(await screen.findByText('Title already exists')).toBeInTheDocument();
  });

  it('pre-fills fields, renders items section and calls PATCH when editing', async () => {
    mockedApiClient.get.mockImplementation((url: string) => {
      if (url === '/admin/topics') return Promise.resolve({ data: [] });
      if (url === '/admin/dictionary-collections') return Promise.resolve({ data: [] });
      if (url === '/admin/lessons') return Promise.resolve({ data: [existingLesson] });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockedApiClient.patch.mockResolvedValueOnce({ data: { id: 'lesson1' } });
    const user = userEvent.setup();

    renderWithProviders(<CreateLessonForm lesson={existingLesson} onDone={jest.fn()} />);

    expect(screen.getByLabelText(/Title \(EN\)/)).toHaveValue('Title');
    expect(screen.getByRole('button', { name: 'Update Lesson' })).toBeInTheDocument();
    expect(await screen.findByText('Lesson Items')).toBeInTheDocument();
    expect(await screen.findByText('Verbs')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update Lesson' }));

    await waitFor(() => expect(mockedApiClient.patch).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/admin/lessons/lesson1',
      expect.objectContaining({ titleEn: 'Title' }),
    );
  });
});
