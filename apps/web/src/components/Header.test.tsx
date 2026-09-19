import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../test-utils/renderWithProviders';
import { Header } from './Header';

jest.mock('../lib/auth-client', () => ({
  authClient: { signOut: jest.fn() },
}));

const user1 = {
  id: 'user1',
  email: 'a@b.com',
  name: 'Ana Horvat',
  avatarUrl: null,
  role: 'STUDENT',
  nativeLanguage: 'EN',
  theme: 'SYSTEM',
  xpTotal: 120,
  currentStreak: 7,
};

describe('Header', () => {
  it('shows only the brand and language menu for guests', () => {
    renderWithProviders(<Header />, { auth: { loading: false, user: null } });

    expect(screen.getByRole('link', { name: 'CroGrammar' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Language' })).toBeInTheDocument();
    expect(screen.queryByText('Exercises')).not.toBeInTheDocument();
  });

  it('shows navigation, XP and streak for an authenticated user', () => {
    renderWithProviders(<Header />, { auth: { loading: false, user: user1 } });

    expect(screen.getByRole('link', { name: 'Lessons' })).toHaveAttribute('href', '/lessons');
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ana Horvat' })).toBeInTheDocument();
  });

  it('opens the exercises menu on click and lists its links', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />, { auth: { loading: false, user: user1 } });

    await user.click(screen.getByRole('button', { name: 'Exercises' }));

    expect(await screen.findByRole('menuitem', { name: 'Grammar' })).toHaveAttribute(
      'href',
      '/exercises/grammar',
    );
    expect(screen.getByRole('menuitem', { name: 'Vocabulary' })).toHaveAttribute(
      'href',
      '/exercises/vocabulary',
    );
  });

  it('opens the user menu with settings and logout', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />, { auth: { loading: false, user: user1 } });

    await user.click(screen.getByRole('button', { name: 'Ana Horvat' }));

    expect(await screen.findByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });
});
