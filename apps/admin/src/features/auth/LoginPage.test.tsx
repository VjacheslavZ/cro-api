import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AuthProvider } from './auth-context';
import { LoginPage } from './LoginPage';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('submits valid credentials and calls POST /admin/auth/login', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        accessToken: 'access1',
        refreshToken: 'refresh1',
        admin: { id: 'a1', email: 'test@gmail.com' },
      },
    });
    const user = userEvent.setup();

    renderWithProviders(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('Email'), 'test@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'zxcv1234');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(mockedApiClient.post).toHaveBeenCalledWith('/admin/auth/login', {
        email: 'test@gmail.com',
        password: 'zxcv1234',
      }),
    );
  });

  it('navigates to "/" on successful login', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        accessToken: 'access1',
        refreshToken: 'refresh1',
        admin: { id: 'a1', email: 'test@gmail.com' },
      },
    });
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<div>Dashboard Home</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.type(screen.getByLabelText('Email'), 'test@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'zxcv1234');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Dashboard Home')).toBeInTheDocument();
  });

  it('shows an error message and does not navigate on a failed login', async () => {
    mockedApiClient.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    const user = userEvent.setup();

    renderWithProviders(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('Email'), 'test@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('prevents submission via client-side validation when fields are empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInvalid();
    });
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });
});
