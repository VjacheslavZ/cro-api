import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { authClient } from '@/lib/auth-client.ts';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { EmailAuthForm } from './EmailAuthForm';

jest.mock('../../lib/auth-client', () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
  },
}));

const mockedAuthClient = authClient as unknown as {
  signIn: { email: jest.Mock };
  signUp: { email: jest.Mock };
};

describe('EmailAuthForm', () => {
  beforeEach(() => {
    mockedAuthClient.signIn.email.mockReset();
    mockedAuthClient.signUp.email.mockReset();
  });

  it('submits login credentials and shows no error on success', async () => {
    mockedAuthClient.signIn.email.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<EmailAuthForm mode="login" />);

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(mockedAuthClient.signIn.email).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password1',
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the fields while the request is pending', async () => {
    let resolve!: (value: { error: null }) => void;
    mockedAuthClient.signIn.email.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();

    renderWithProviders(<EmailAuthForm mode="login" />);

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(screen.getByLabelText(/Email/)).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();

    resolve({ error: null });
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toBeEnabled());
  });

  it('shows the returned message and keeps the typed values when login fails', async () => {
    mockedAuthClient.signIn.email.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });
    const user = userEvent.setup();

    renderWithProviders(<EmailAuthForm mode="login" />);

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(screen.getByLabelText(/Email/)).toHaveValue('a@b.com');
  });

  it('falls back to the generic message when the request throws', async () => {
    mockedAuthClient.signIn.email.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();

    renderWithProviders(<EmailAuthForm mode="login" />);

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Login failed. Please try again.');
  });

  it('submits registration data including the name field and calls signUp.email', async () => {
    mockedAuthClient.signUp.email.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<EmailAuthForm mode="register" />);

    await user.type(screen.getByLabelText(/Name/), 'John');
    await user.type(screen.getByLabelText(/Email/), 'john@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockedAuthClient.signUp.email).toHaveBeenCalledWith({
      email: 'john@b.com',
      password: 'password1',
      name: 'John',
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled());
  });

  it('does not render the name field in login mode', () => {
    renderWithProviders(<EmailAuthForm mode="login" />);

    expect(screen.queryByLabelText(/Name/)).not.toBeInTheDocument();
  });

  it('resets the form fields when mode changes', async () => {
    const user = userEvent.setup();

    const { rerender } = renderWithProviders(<EmailAuthForm mode="login" />);

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    expect(screen.getByLabelText(/Email/)).toHaveValue('a@b.com');

    rerender(<EmailAuthForm mode="register" />);

    expect(screen.getByLabelText(/Email/)).toHaveValue('');
  });
});
