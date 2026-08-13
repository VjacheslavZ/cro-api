import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AdminsPage } from './AdminsPage';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AdminsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({
      data: [{ id: 'admin1', email: 'first@example.com', createdAt: '2024-01-01T00:00:00.000Z' }],
    });
  });

  it('renders the Admins tab by default', async () => {
    renderWithProviders(<AdminsPage />);

    expect(await screen.findByText('first@example.com')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('switches to the Create Admin tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminsPage />);

    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('tab', { name: 'Create Admin' }));

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Admin' })).toBeInTheDocument();
  });
});
