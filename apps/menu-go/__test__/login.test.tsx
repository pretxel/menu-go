import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';

import Login from '../src/components/Login';
import { navigateTo } from '../src/lib/navigate';

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));

const mockSignIn = signIn as jest.Mock;
jest.mock('../src/lib/navigate', () => ({ navigateTo: jest.fn() }));
const assign = navigateTo as jest.Mock;

beforeAll(() => {
  window.history.pushState({}, '', '/login?callbackUrl=/d/publish');
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn() as jest.Mock;
});

function fill(fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
  }
}

describe('Login email and password', () => {
  test('sign-in calls the credentials provider and goes to the callback', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    render(<Login />);
    fill({ Email: 'pat@example.com', Password: 'correct-horse-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with email' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/d/publish'));
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'pat@example.com',
      password: 'correct-horse-1',
      redirect: false,
      callbackUrl: '/d/publish',
    });
  });

  test('shows the generic error when credentials are rejected', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });
    render(<Login />);
    fill({ Email: 'pat@example.com', Password: 'wrong-wrong-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with email' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(assign).not.toHaveBeenCalled();
  });

  test('sign-up creates the account, then signs in and goes to the callback', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Create one' }));
    fill({ Name: 'Pat', Email: 'pat@example.com', Password: 'correct-horse-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/d/publish'));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/sign-up');
    expect(JSON.parse(init.body)).toEqual({ name: 'Pat', email: 'pat@example.com', password: 'correct-horse-1' });
    expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ email: 'pat@example.com' }));
  });

  test('sign-up shows field errors and does not sign in', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ fieldErrors: { password: ['Password must be at least 8 characters.'] } }),
    });
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Create one' }));
    fill({ Email: 'pat@example.com', Password: 'short' });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
