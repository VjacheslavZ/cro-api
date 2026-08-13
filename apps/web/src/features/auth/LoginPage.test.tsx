import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { authClient } from '../../lib/auth-client';
import { LoginPage } from './LoginPage';

jest.mock('../../lib/auth-client', () => ({
  authClient: {
    signIn: { social: jest.fn(), email: jest.fn() },
    signUp: { email: jest.fn() },
  },
}));

const mockedAuthClient = authClient as unknown as {
  signIn: { social: jest.Mock; email: jest.Mock };
  signUp: { email: jest.Mock };
};

describe('LoginPage', () => {
  beforeEach(() => {
    mockedAuthClient.signIn.social.mockReset();
    mockedAuthClient.signIn.email.mockReset();
    mockedAuthClient.signUp.email.mockReset();
  });

  it('calls signIn.social with the google provider when clicking the Google button', async () => {
    mockedAuthClient.signIn.social.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(mockedAuthClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });

  it('reveals the email form fields when clicking "Continue with email"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    expect(screen.queryByLabelText(/Email/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue with email' }));

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
  });

  it('switches copy between login and register modes when toggling', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByText('Create an account')).not.toBeInTheDocument();

    await user.click(screen.getByText("Don't have an account? Register"));

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();

    await user.click(screen.getByText('Already have an account? Log in'));

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });
});
