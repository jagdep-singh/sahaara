import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type Session = {
  userId: string;
  role: 'ADMIN' | 'DONOR';
  email: string;
};

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be set (32+ chars)');
  }
  return new TextEncoder().encode(value);
};

export async function signSession(session: Session) {
  return new SignJWT({ role: session.role, email: session.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifySessionToken(
  token?: string
): Promise<Session | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: String(payload.sub),
      role: payload.role as Session['role'],
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export async function createSession(session: Session) {
  (await cookies()).set('session', await signSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export const getSession = async () =>
  verifySessionToken((await cookies()).get('session')?.value);

export const destroySession = async () => {
  (await cookies()).delete('session');
};

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  return session;
}
