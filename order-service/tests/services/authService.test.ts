/// <reference types="jest" />

import crypto from 'crypto';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import prisma from '../../src/prisma/client';
import {
  registerAndAuthenticate,
  loginAndAuthenticate,
  refreshAuthentication,
} from '../../src/services/authService';
import { signRefreshToken } from '../../src/utils/jwt';

jest.mock('../../src/prisma/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn((value: string) => Promise.resolve(`hashed:${value}`)),
  compare: jest.fn((value: string, hash: string) =>
    Promise.resolve(hash === `hashed:${value}`)
  ),
}));

const mockPrisma = prisma as any;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and returns tokens', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      password: 'hashed:secret',
      role: 'USER',
      createdAt: new Date(),
      refreshTokens: [],
    });
    mockPrisma.refreshToken.create.mockImplementation(
  async ({ data }: { data: any }) => {
    return {
      id: 'refresh-1',
      token: data.token,
      userId: data.userId,
      expiresAt: data.expiresAt,
      revoked: false,
      createdAt: new Date(),
    };
  }
);

    const result = await registerAndAuthenticate({
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(result.user.email).toBe('alice@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
  });

  it('logs in existing user with correct credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'bob@example.com',
      password: 'hashed:pass',
      role: 'ADMIN',
      createdAt: new Date(),
      refreshTokens: [],
    });
    mockPrisma.refreshToken.create.mockResolvedValue({
      id: 'refresh-2',
      token: 'token',
      userId: 'user-2',
      expiresAt: new Date(),
    });

    const result = await loginAndAuthenticate({
      email: 'bob@example.com',
      password: 'pass',
    });

    expect(result.user.id).toBe('user-2');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
  });

  it('refreshes tokens when provided a valid refresh token', async () => {
    const existingUser = {
      id: 'user-3',
      email: 'carol@example.com',
      password: 'hashed:another',
      role: 'USER' as const,
      createdAt: new Date(),
      refreshTokens: [],
    };

    const token = signRefreshToken({ sub: existingUser.id, role: existingUser.role });
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh-3',
      token: hashedToken,
      userId: existingUser.id,
      user: existingUser,
      expiresAt: new Date(Date.now() + 1000),
      revoked: false,
    });
    mockPrisma.refreshToken.update.mockResolvedValue({ revocation: true });

    const result = await refreshAuthentication(token);

    expect(result.user.id).toBe(existingUser.id);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalled();
    expect(mockPrisma.refreshToken.update).toHaveBeenCalled();
  });
});
