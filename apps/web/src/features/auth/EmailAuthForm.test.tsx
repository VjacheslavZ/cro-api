import { screen } from '@testing-library/react';
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

  it('submits login credentials and calls onSuccess when there is no error', async () => {
    mockedAuthClient.signIn.email.mockResolvedValue({ error: null });
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const setLoading = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <EmailAuthForm
        mode="login"
        loading={false}
        setLoading={setLoading}
        onSuccess={onSuccess}
        onError={onError}
      />,
    );

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(mockedAuthClient.signIn.email).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password1',
    });
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls onError with the returned message when login fails', async () => {
    mockedAuthClient.signIn.email.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <EmailAuthForm
        mode="login"
        loading={false}
        setLoading={jest.fn()}
        onSuccess={onSuccess}
        onError={onError}
      />,
    );

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(onError).toHaveBeenCalledWith('Invalid credentials');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('submits registration data including the name field and calls signUp.email', async () => {
    mockedAuthClient.signUp.email.mockResolvedValue({ error: null });
    const onSuccess = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <EmailAuthForm
        mode="register"
        loading={false}
        setLoading={jest.fn()}
        onSuccess={onSuccess}
        onError={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Name/), 'John');
    await user.type(screen.getByLabelText(/Email/), 'john@b.com');
    await user.type(screen.getByLabelText(/Password/), 'password1');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockedAuthClient.signUp.email).toHaveBeenCalledWith({
      email: 'john@b.com',
      password: 'password1',
      name: 'John',
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('does not render the name field in login mode', () => {
    renderWithProviders(
      <EmailAuthForm
        mode="login"
        loading={false}
        setLoading={jest.fn()}
        onSuccess={jest.fn()}
        onError={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/Name/)).not.toBeInTheDocument();
  });

  it('resets the form fields when mode changes', async () => {
    const user = userEvent.setup();
    const props = {
      loading: false,
      setLoading: jest.fn(),
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };

    const { rerender } = renderWithProviders(<EmailAuthForm mode="login" {...props} />);

    await user.type(screen.getByLabelText(/Email/), 'a@b.com');
    expect(screen.getByLabelText(/Email/)).toHaveValue('a@b.com');

    rerender(<EmailAuthForm mode="register" {...props} />);

    expect(screen.getByLabelText(/Email/)).toHaveValue('');
  });
});
