import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import prisma from '../prisma/client';
import { LoginUserDto } from '../dto/auth/loginUser.dto';
import { RegisterUserDto } from '../dto/auth/registerUser.dto';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
  accessTokenTTLSeconds,
  refreshTokenTTLSeconds,
} from '../utils/jwt';
import { User, UserRole } from '@prisma/client';

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = accessTokenTTLSeconds;
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = refreshTokenTTLSeconds;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse extends TokenPair {
  user: AuthenticatedUser;
}

const HASH_ROUNDS = 12;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function registerAndAuthenticate(dto: RegisterUserDto): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (existing) {
    throw new Error('Email already registered');
  }

  const user = await prisma.user.create({
    data: {
      email: dto.email.toLowerCase(),
      password: await bcrypt.hash(dto.password, HASH_ROUNDS),
      role: dto.role ?? UserRole.USER,
    },
  });

  return buildAuthResponse(user);
}

export async function loginAndAuthenticate(dto: LoginUserDto): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(dto.password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  return buildAuthResponse(user);
}

export async function refreshAuthentication(refreshToken: string): Promise<AuthResponse> {
  let parsedToken: JwtPayload;

  try {
    parsedToken = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error('Invalid refresh token');
  }

  const hashedToken = hashToken(refreshToken);
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.revoked) {
    throw new Error('Invalid refresh token');
  }

  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });
    throw new Error('Refresh token expired');
  }

  if (parsedToken.sub !== tokenRecord.userId) {
    throw new Error('Invalid refresh token');
  }

  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true },
  });

  return buildAuthResponse(tokenRecord.user);
}

async function buildAuthResponse(user: User): Promise<AuthResponse> {
  const tokenPair = await createTokenPair(user);

  return {
    ...tokenPair,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

async function createTokenPair(user: User): Promise<TokenPair> {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  };
}
