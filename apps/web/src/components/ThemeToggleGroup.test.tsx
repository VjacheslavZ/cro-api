import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../test-utils/renderWithProviders';
import { apiClient } from '../api/client';
import { ThemeToggleGroup } from './ThemeToggleGroup';

jest.mock('../api/client', () => ({
  apiClient: { patch: jest.fn() },
}));

const mockedApiClient = apiClient as unknown as { patch: jest.Mock };

const user1 = {
  id: 'user1',
  email: 'a@b.com',
  name: 'A',
  avatarUrl: null,
  role: 'STUDENT',
  nativeLanguage: 'EN',
  theme: 'SYSTEM',
  xpTotal: 0,
  currentStreak: 0,
};

describe('ThemeToggleGroup', () => {
  beforeEach(() => {
    mockedApiClient.patch.mockReset();
    localStorage.clear();
  });

  it('renders the three options with SYSTEM selected by default', () => {
    renderWithProviders(<ThemeToggleGroup />);

    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates the local preference without calling the API for a guest', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeToggleGroup />, {
      auth: { loading: false, user: null },
    });

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(store.getState().preferences.theme).toBe('DARK');
    expect(mockedApiClient.patch).not.toHaveBeenCalled();
  });

  it('persists the choice on the profile for a signed-in user', async () => {
    mockedApiClient.patch.mockResolvedValue({ data: { ...user1, theme: 'LIGHT' } });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeToggleGroup />, {
      auth: { loading: false, user: user1 },
    });

    await user.click(screen.getByRole('button', { name: 'Light' }));

    expect(store.getState().preferences.theme).toBe('LIGHT');
    expect(mockedApiClient.patch).toHaveBeenCalledWith('/users/me', { theme: 'LIGHT' });
    await waitFor(() => {
      expect(store.getState().auth.user?.theme).toBe('LIGHT');
    });
  });

  it('keeps the local choice when the request fails', async () => {
    mockedApiClient.patch.mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeToggleGroup />, {
      auth: { loading: false, user: user1 },
    });

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    await waitFor(() => {
      expect(mockedApiClient.patch).toHaveBeenCalled();
    });
    expect(store.getState().preferences.theme).toBe('DARK');
    expect(store.getState().auth.user?.theme).toBe('SYSTEM');
  });
});
