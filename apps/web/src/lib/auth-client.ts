import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
