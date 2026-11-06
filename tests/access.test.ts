import { describe, expect, it } from 'vitest';

import { signSession, verifySessionToken } from '@/lib/auth';

describe('session access boundaries', () => {
  it('accepts a signed admin session and rejects tampering', async () => {
    const token = await signSession({ userId: 'admin-id', role: 'ADMIN', email: 'admin@example.org' });
    expect((await verifySessionToken(token))?.role).toBe('ADMIN');
    expect(await verifySessionToken(`${token}tampered`)).toBeNull();
  });

  it('rejects missing and malformed session tokens', async () => {
    expect(await verifySessionToken()).toBeNull();
    expect(await verifySessionToken('not-a-jwt')).toBeNull();
  });
});
