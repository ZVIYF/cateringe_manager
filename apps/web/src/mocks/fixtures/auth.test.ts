import { AuthSchemas } from '@catering/shared';
import { describe, expect, it } from 'vitest';
import { mockPermissions, mockUsers } from './auth';

describe('auth fixtures match the shared schemas', () => {
  it.each(mockUsers)('$email parses as AuthUser, LoginResponse and MeResponse', (user) => {
    expect(() => AuthSchemas.AuthUser.parse(user)).not.toThrow();
    expect(() => AuthSchemas.LoginResponse.parse({ data: { accessToken: 'token', user } })).not.toThrow();
    expect(() =>
      AuthSchemas.MeResponse.parse({ data: { user, permissions: mockPermissions[user.role] } })
    ).not.toThrow();
  });

  it('defines permissions for every user role', () => {
    for (const user of mockUsers) expect(mockPermissions[user.role]).toBeDefined();
  });
});
