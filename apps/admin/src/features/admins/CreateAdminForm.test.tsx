import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { CreateAdminForm } from './CreateAdminForm';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CreateAdminForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty fields', () => {
    renderWithProviders(<CreateAdminForm onCreated={jest.fn()} />);

    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm Password')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create Admin' })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAdminForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Admin' }));

    expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('shows a validation error for a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAdminForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create Admin' }));

    expect(await screen.findAllByText(/8 characters/i)).toHaveLength(2);
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('shows a validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAdminForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Create Admin' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('submits the form and calls POST /admin/admins with the right payload', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 'admin1' } });
    const user = userEvent.setup();
    renderWithProviders(<CreateAdminForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Admin' }));

    await waitFor(() => expect(mockedApiClient.post).toHaveBeenCalledTimes(1));
    expect(mockedApiClient.post).toHaveBeenCalledWith('/admin/admins', {
      email: 'admin@example.com',
      password: 'password123',
    });
    expect(await screen.findByText('Admin created successfully')).toBeInTheDocument();
  });

  it('shows the server error message when the request fails (e.g. duplicate email)', async () => {
    mockedApiClient.post.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<CreateAdminForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Admin' }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });
});
