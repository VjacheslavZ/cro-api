import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { apiClient } from '../../api/client';
import { LanguageSelectPage } from './LanguageSelectPage';

jest.mock('../../api/client', () => ({
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
  xpTotal: 0,
  currentStreak: 0,
};

describe('LanguageSelectPage', () => {
  beforeEach(() => {
    mockedApiClient.patch.mockReset();
  });

  it('calls apiClient.patch with the selected language and updates the store on success', async () => {
    mockedApiClient.patch.mockResolvedValue({ data: user1 });
    const user = userEvent.setup();

    const { store } = renderWithProviders(<LanguageSelectPage />, {
      auth: { loading: false, user: null },
    });

    await user.click(screen.getAllByText('English')[0]);

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/users/me', { nativeLanguage: 'EN' });

    await waitFor(() => {
      expect(store.getState().auth.user).toEqual(user1);
    });
  });

  it('does not update the store when the request fails', async () => {
    mockedApiClient.patch.mockRejectedValue(new Error('network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    const { store } = renderWithProviders(<LanguageSelectPage />, {
      auth: { loading: false, user: null },
    });

    await user.click(screen.getByText('Русский'));

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/users/me', { nativeLanguage: 'RU' });

    await waitFor(() => {
      expect(mockedApiClient.patch).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().auth.user).toBeNull();

    consoleSpy.mockRestore();
  });
});
