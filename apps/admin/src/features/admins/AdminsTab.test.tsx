import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AdminsTab } from './AdminsTab';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AdminsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading spinner while the admins are being fetched', () => {
    mockedApiClient.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the list of admins once loaded', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: [
        { id: 'admin1', email: 'first@example.com', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'admin2', email: 'second@example.com', createdAt: '2024-02-01T00:00:00.000Z' },
      ],
    });

    renderWithProviders(<AdminsTab />);

    expect(await screen.findByText('first@example.com')).toBeInTheDocument();
    expect(screen.getByText('second@example.com')).toBeInTheDocument();
    expect(mockedApiClient.get).toHaveBeenCalledWith('/admin/admins');
  });

  it('renders an empty table when there are no admins', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] });

    renderWithProviders(<AdminsTab />);

    expect(await screen.findByText('Email')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an error alert when the request fails', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<AdminsTab />);

    expect(await screen.findByText('An error occurred')).toBeInTheDocument();
  });
});
