import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ThemeMenu } from './ThemeMenu';

jest.mock('../../api/client', () => ({
  apiClient: { patch: jest.fn() },
}));

describe('ThemeMenu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens the menu and selects a theme', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeMenu />);

    await user.click(screen.getByRole('button', { name: 'Theme' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(store.getState().preferences.theme).toBe('DARK');
  });

  it('marks the current theme as checked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeMenu />, {
      preferences: { speechEnabled: true, theme: 'LIGHT' },
    });

    await user.click(screen.getByRole('button', { name: 'Theme' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
