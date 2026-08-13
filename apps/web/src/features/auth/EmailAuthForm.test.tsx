import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { authClient } from '../../lib/auth-client';
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
    const setFormData = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <EmailAuthForm
        mode="login"
        loading={false}
        setLoading={jest.fn()}
        onSuccess={onSuccess}
        onError={onError}
        formData={{ name: '', email: 'a@b.com', password: 'password1' }}
        setFormData={setFormData}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(mockedAuthClient.signIn.email).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password1',
    });
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
        formData={{ name: '', email: 'a@b.com', password: 'password1' }}
        setFormData={jest.fn()}
      />,
    );

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
        formData={{ name: 'John', email: 'john@b.com', password: 'password1' }}
        setFormData={jest.fn()}
      />,
    );

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockedAuthClient.signUp.email).toHaveBeenCalledWith({
      email: 'john@b.com',
      password: 'password1',
      name: 'John',
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
