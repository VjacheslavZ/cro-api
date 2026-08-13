import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { CreateCollectionForm } from './CreateCollectionForm';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CreateCollectionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty fields in create mode', () => {
    renderWithProviders(<CreateCollectionForm collection={null} onDone={jest.fn()} />);

    expect(screen.getByLabelText(/Name \(English\)/)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create Collection' })).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateCollectionForm collection={null} onDone={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create Collection' }));

    expect(await screen.findByText('English name is required')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('submits the form and calls POST /admin/dictionary-collections', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 'col1' } });
    const user = userEvent.setup();
    renderWithProviders(<CreateCollectionForm collection={null} onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/Name \(English\)/), 'Animals');
    await user.type(screen.getByLabelText(/Name \(Russian\)/), 'Животные');
    await user.type(screen.getByLabelText(/Name \(Ukrainian\)/), 'Тварини');
    await user.click(screen.getByRole('button', { name: 'Create Collection' }));

    await waitFor(() => expect(mockedApiClient.post).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/admin/dictionary-collections',
      expect.objectContaining({ nameEn: 'Animals', nameRu: 'Животные', nameUk: 'Тварини' }),
    );
    expect(await screen.findByText('Collection created successfully')).toBeInTheDocument();
  });

  it('shows the server error message when the request fails', async () => {
    mockedApiClient.post.mockRejectedValueOnce({
      response: { data: { message: 'Name already exists' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<CreateCollectionForm collection={null} onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/Name \(English\)/), 'Animals');
    await user.type(screen.getByLabelText(/Name \(Russian\)/), 'Животные');
    await user.type(screen.getByLabelText(/Name \(Ukrainian\)/), 'Тварини');
    await user.click(screen.getByRole('button', { name: 'Create Collection' }));

    expect(await screen.findByText('Name already exists')).toBeInTheDocument();
  });

  it('pre-fills fields and calls PATCH when editing an existing collection', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ data: { id: 'col1' } });
    const user = userEvent.setup();
    const collection = {
      id: 'col1',
      nameRu: 'Животные',
      nameUk: 'Тварини',
      nameEn: 'Animals',
      description: 'Farm and wild animals',
      sortOrder: 2,
      predefinedWordCount: 5,
    };

    renderWithProviders(<CreateCollectionForm collection={collection} onDone={jest.fn()} />);

    expect(screen.getByLabelText(/Name \(English\)/)).toHaveValue('Animals');
    expect(screen.getByRole('button', { name: 'Update Collection' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update Collection' }));

    await waitFor(() => expect(mockedApiClient.patch).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/admin/dictionary-collections/col1',
      expect.objectContaining({ nameEn: 'Animals' }),
    );
  });
});
