import { User } from 'firebase/auth';

const API_BASE = process.env.EXPO_PRIVATE_API_BASE;

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  phone: string;
};

export async function registerUserWithBackend(
  user: User,
  payload: RegisterPayload
) {
  if (!user) {
    throw new Error('No authenticated Firebase user');
  }

  // 1. Get Firebase ID token
  const token = await user.getIdToken(true);

  // 2. Call backend
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = 'Registration failed';

    try {
      const err = await res.json();
      message = err.message || message;
    } catch {
      // ignore parse errors
    }

    throw new Error(message);
  } else {
    console.log('Success');
  }

  return res.json();
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  if (!API_BASE) {
    throw new Error('API base URL is not defined');
  }

  const res = await fetch(`${API_BASE}/auth/check-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let message = 'Failed to check email';

    try {
      const err = await res.json();
      message = err.message || message;
    } catch {}

    throw new Error(message);
  }

  const data: { exists: boolean } = await res.json();

  // available = NOT exists
  return !data.exists;
}
