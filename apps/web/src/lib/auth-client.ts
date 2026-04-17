import { createAuthClient } from 'better-auth/react';

const apiBaseURL = (
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`
).replace('localhost', window.location.hostname);

export const authClient = createAuthClient({
  baseURL: apiBaseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
