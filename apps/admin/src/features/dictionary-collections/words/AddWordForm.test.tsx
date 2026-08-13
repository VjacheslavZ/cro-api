import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { AddWordForm } from './AddWordForm';
import type { PredefinedWordItem } from './AddWordForm';
import { apiClient } from '../../../api/client';

jest.mock('../../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AddWordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({
      data: { translationRu: '', translationUk: '', translationEn: '' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders empty fields in create mode', () => {
    renderWithProviders(<AddWordForm editing={null} isPending={false} onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Word (HR)')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddWordForm editing={null} isPending={false} onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
  });

  it('debounces wordHr input and requests an AI translation after 2 seconds', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AddWordForm editing={null} isPending={false} onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText('Word (HR)'), 'macka');

    expect(mockedApiClient.get).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() =>
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/admin/dictionary-collections/ai-translation',
        { params: { word: 'macka' } },
      ),
    );
  });

  it('auto-fills translation fields when the AI translation response resolves', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: { translationRu: 'кошка', translationUk: 'кішка', translationEn: 'cat' },
    });
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AddWordForm editing={null} isPending={false} onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText('Word (HR)'), 'macka');
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(screen.getByLabelText('Translation (RU)')).toHaveValue('кошка'));
    expect(screen.getByLabelText('Translation (UK)')).toHaveValue('кішка');
    expect(screen.getByLabelText('Translation (EN)')).toHaveValue('cat');
  });

  it('submits validated form data via onSubmit', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<AddWordForm editing={null} isPending={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Word (HR)'), 'macka');
    await user.type(screen.getByLabelText('Translation (RU)'), 'кошка');
    await user.type(screen.getByLabelText('Translation (UK)'), 'кішка');
    await user.type(screen.getByLabelText('Translation (EN)'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        wordHr: 'macka',
        translationRu: 'кошка',
        translationUk: 'кішка',
        translationEn: 'cat',
        sortOrder: 0,
      }),
    );
  });

  it('resets its fields when the editing prop changes to a different word', () => {
    const editing1: PredefinedWordItem = {
      id: 'w1',
      wordHr: 'macka',
      translationRu: 'кошка',
      translationUk: 'кішка',
      translationEn: 'cat',
      sortOrder: 1,
    };
    const editing2: PredefinedWordItem = {
      id: 'w2',
      wordHr: 'pas',
      translationRu: 'собака',
      translationUk: 'собака',
      translationEn: 'dog',
      sortOrder: 2,
    };

    const result = renderWithProviders(
      <AddWordForm editing={editing1} isPending={false} onSubmit={jest.fn()} />,
    );

    expect(screen.getByLabelText('Word (HR)')).toHaveValue('macka');
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();

    result.rerender(
      <QueryClientProvider client={result.queryClient}>
        <MemoryRouter>
          <AddWordForm editing={editing2} isPending={false} onSubmit={jest.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText('Word (HR)')).toHaveValue('pas');
    expect(screen.getByLabelText('Translation (EN)')).toHaveValue('dog');
  });
});
