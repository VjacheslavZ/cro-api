import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lesson } from '@cro/shared';
import { LessonItemType } from '@cro/shared';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { LessonItemsSection } from './LessonItemsSection';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const baseLesson: Lesson = {
  id: 'lesson1',
  titleHr: 'Naslov',
  titleRu: 'Заголовок',
  titleUk: 'Заголовок',
  titleEn: 'Title',
  descriptionHr: null,
  descriptionRu: null,
  descriptionUk: null,
  descriptionEn: null,
  sortOrder: 0,
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

const topics = [
  { id: 'topic1', nameEn: 'Verbs' },
  { id: 'topic2', nameEn: 'Nouns' },
];

const collections = [{ id: 'col1', nameEn: 'Animals' }];

// The `<Select>` in AddLessonItemRow isn't wired to its `<InputLabel>` via labelId/id,
// so it has no accessible name — locate it by its position relative to the label text.
function getTopicCombobox() {
  const label = screen.getAllByText('Add Exercise Topic')[0];
  const formControl = label.closest('.MuiFormControl-root') as HTMLElement;
  return within(formControl).getByRole('combobox');
}

function mockGets(lessons: Lesson[]) {
  mockedApiClient.get.mockImplementation((url: string) => {
    if (url === '/admin/topics') return Promise.resolve({ data: topics });
    if (url === '/admin/dictionary-collections') return Promise.resolve({ data: collections });
    if (url === '/admin/lessons') return Promise.resolve({ data: lessons });
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

describe('LessonItemsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current items and excludes already-added options from the dropdowns', async () => {
    mockGets([baseLesson]);
    renderWithProviders(<LessonItemsSection lesson={baseLesson} />);

    expect(await screen.findByText('Verbs')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(getTopicCombobox());
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).queryByText('Verbs')).not.toBeInTheDocument();
    expect(within(listbox).getByText('Nouns')).toBeInTheDocument();
  });

  it('shows the empty state when the lesson has no items', async () => {
    const emptyLesson = { ...baseLesson, items: [] };
    mockGets([emptyLesson]);
    renderWithProviders(<LessonItemsSection lesson={emptyLesson} />);

    expect(
      await screen.findByText('No items yet. Add exercise topics or dictionary collections below.'),
    ).toBeInTheDocument();
  });

  it('adds a topic item via the dropdown and calls POST /admin/lessons/:id/items', async () => {
    mockGets([baseLesson]);
    mockedApiClient.post.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<LessonItemsSection lesson={baseLesson} />);

    await screen.findByText('Verbs');
    await user.click(getTopicCombobox());
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Nouns'));

    await user.click(screen.getByRole('button', { name: 'Add Topic' }));

    await waitFor(() => expect(mockedApiClient.post).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.post).toHaveBeenCalledWith('/admin/lessons/lesson1/items', {
      itemType: LessonItemType.EXERCISE_TOPIC,
      itemId: 'topic2',
      sortOrder: 1,
    });
  });

  it('removes an item when its delete icon is clicked', async () => {
    mockGets([baseLesson]);
    mockedApiClient.delete.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<LessonItemsSection lesson={baseLesson} />);

    await screen.findByText('Verbs');
    const deleteButton = screen
      .getAllByRole('button')
      .find((btn) => btn.querySelector('svg[data-testid="DeleteIcon"]'));
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton as HTMLElement);

    await waitFor(() => expect(mockedApiClient.delete).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/admin/lessons/lesson1/items/item1');
  });

  it('the "Add Topic" button is disabled until an option is selected', async () => {
    mockGets([baseLesson]);
    renderWithProviders(<LessonItemsSection lesson={baseLesson} />);

    await screen.findByText('Verbs');
    expect(screen.getByRole('button', { name: 'Add Topic' })).toBeDisabled();
  });
});
