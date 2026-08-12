import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { CreateTopicForm } from './CreateTopicForm';
import { apiClient } from '../../api/client';
import type { TopicData } from './TopicsPage';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('../../shared/components/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
  }) => <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />,
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CreateTopicForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty fields in create mode', () => {
    renderWithProviders(<CreateTopicForm topic={null} onDone={jest.fn()} />);

    expect(screen.getByLabelText('Name (HR)')).toHaveValue('');
    expect(screen.getByLabelText('Name (EN)')).toHaveValue('');
    expect(screen.getByLabelText('Name (UK)')).toHaveValue('');
    expect(screen.getByLabelText('Name (RU)')).toHaveValue('');
    expect(screen.getByLabelText('Sort Order')).toHaveValue(0);
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Create Topic' })).toBeInTheDocument();
  });

  it('shows validation errors when required name fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTopicForm topic={null} onDone={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create Topic' }));

    expect(await screen.findByText('Name (HR) is required')).toBeInTheDocument();
    expect(screen.getByText('Name (EN) is required')).toBeInTheDocument();
    expect(screen.getByText('Name (UK) is required')).toBeInTheDocument();
    expect(screen.getByText('Name (RU) is required')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('submits the form and calls POST /admin/topics', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 'top1' } });
    const user = userEvent.setup();
    renderWithProviders(<CreateTopicForm topic={null} onDone={jest.fn()} />);

    await user.type(screen.getByLabelText('Name (HR)'), 'Glagoli');
    await user.type(screen.getByLabelText('Name (EN)'), 'Verbs');
    await user.type(screen.getByLabelText('Name (UK)'), 'Дієслова');
    await user.type(screen.getByLabelText('Name (RU)'), 'Глаголы');
    await user.click(screen.getByRole('button', { name: 'Create Topic' }));

    await waitFor(() => expect(mockedApiClient.post).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/admin/topics',
      expect.objectContaining({
        nameHr: 'Glagoli',
        nameEn: 'Verbs',
        nameUk: 'Дієслова',
        nameRu: 'Глаголы',
        rulesHtmlHr: null,
        rulesHtmlRu: null,
        rulesHtmlUk: null,
        rulesHtmlEn: null,
      }),
    );
    expect(await screen.findByText('Topic created successfully')).toBeInTheDocument();
  });

  it('shows the server error message when the request fails', async () => {
    mockedApiClient.post.mockRejectedValueOnce({
      response: { data: { message: 'Topic already exists' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<CreateTopicForm topic={null} onDone={jest.fn()} />);

    await user.type(screen.getByLabelText('Name (HR)'), 'Glagoli');
    await user.type(screen.getByLabelText('Name (EN)'), 'Verbs');
    await user.type(screen.getByLabelText('Name (UK)'), 'Дієслова');
    await user.type(screen.getByLabelText('Name (RU)'), 'Глаголы');
    await user.click(screen.getByRole('button', { name: 'Create Topic' }));

    expect(await screen.findByText('Topic already exists')).toBeInTheDocument();
  });

  it('pre-fills fields and calls PATCH when editing an existing topic', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ data: { id: 'top1' } });
    const user = userEvent.setup();
    const topic: TopicData = {
      id: 'top1',
      nameHr: 'Glagoli',
      nameRu: 'Глаголы',
      nameUk: 'Дієслова',
      nameEn: 'Verbs',
      sortOrder: 3,
      isActive: false,
      exerciseTypes: [],
      rulesHtmlHr: '<p>pravila</p>',
      rulesHtmlRu: '<p>rules ru</p>',
      rulesHtmlUk: '<p>rules uk</p>',
      rulesHtmlEn: '<p>rules en</p>',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    renderWithProviders(<CreateTopicForm topic={topic} onDone={jest.fn()} />);

    expect(screen.getByLabelText('Name (HR)')).toHaveValue('Glagoli');
    expect(screen.getByLabelText('Name (EN)')).toHaveValue('Verbs');
    expect(screen.getByLabelText('Name (UK)')).toHaveValue('Дієслова');
    expect(screen.getByLabelText('Name (RU)')).toHaveValue('Глаголы');
    expect(screen.getByLabelText('Sort Order')).toHaveValue(3);
    expect(screen.getByRole('checkbox', { name: 'Active' })).not.toBeChecked();
    expect(screen.getByLabelText('Rules (HR)')).toHaveValue('<p>pravila</p>');
    expect(screen.getByRole('button', { name: 'Update Topic' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update Topic' }));

    await waitFor(() => expect(mockedApiClient.patch).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/admin/topics/top1',
      expect.objectContaining({
        nameHr: 'Glagoli',
        rulesHtmlHr: '<p>pravila</p>',
        rulesHtmlRu: '<p>rules ru</p>',
        rulesHtmlUk: '<p>rules uk</p>',
        rulesHtmlEn: '<p>rules en</p>',
      }),
    );
  });
});
