import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AuthProvider, useAuth } from './auth-context';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

function TestConsumer() {
  const { admin, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="admin-email">{admin?.email ?? 'none'}</div>
      <button type="button" onClick={() => login('test@gmail.com', 'zxcv1234')}>
        Login
      </button>
      <button type="button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('starts as unauthenticated with no admin on a fresh mount', () => {
    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('admin-email')).toHaveTextContent('none');
  });

  it('restores a session from valid localStorage on mount', () => {
    localStorage.setItem('accessToken', 'token123');
    localStorage.setItem('admin', JSON.stringify({ id: 'a1', email: 'stored@gmail.com' }));

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('admin-email')).toHaveTextContent('stored@gmail.com');
  });

  it('clears storage and stays logged-out when localStorage holds invalid JSON', () => {
    localStorage.setItem('accessToken', 'token123');
    localStorage.setItem('admin', '{invalid-json');

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('admin')).toBeNull();
  });

  it('login() success sets admin/isAuthenticated and persists to localStorage', async () => {
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
        <TestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('admin-email')).toHaveTextContent('test@gmail.com');
    expect(mockedApiClient.post).toHaveBeenCalledWith('/admin/auth/login', {
      email: 'test@gmail.com',
      password: 'zxcv1234',
    });
    expect(localStorage.getItem('accessToken')).toBe('access1');
    expect(localStorage.getItem('refreshToken')).toBe('refresh1');
    expect(JSON.parse(localStorage.getItem('admin')!)).toEqual({
      id: 'a1',
      email: 'test@gmail.com',
    });
  });

  it('logout() clears state and localStorage even when the API call fails', async () => {
    localStorage.setItem('accessToken', 'access1');
    localStorage.setItem('refreshToken', 'refresh1');
    localStorage.setItem('admin', JSON.stringify({ id: 'a1', email: 'test@gmail.com' }));
    mockedApiClient.post.mockRejectedValueOnce(new Error('network error'));
    const user = userEvent.setup();

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false'));
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('admin')).toBeNull();
  });
});
