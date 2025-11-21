import jwt, {
  SignOptions,
  JwtPayload as BaseJwtPayload,
  Secret,
} from 'jsonwebtoken';

const JWT_SECRET: Secret = (process.env.JWT_SECRET || 'dev_secret') as Secret;
const JWT_ISSUER = process.env.JWT_ISSUER || 'paymentflow-auth';
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS ?? 900);
const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN ??
  `${ACCESS_TOKEN_TTL_SECONDS}s`;

const REFRESH_TOKEN_SECRET: Secret = (process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret') as Secret;
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800);
const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN ??
  `${REFRESH_TOKEN_TTL_SECONDS}s`;

export interface JwtPayload extends BaseJwtPayload {
  sub: string; // user id
  role?: 'USER' | 'ADMIN';
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    issuer: JWT_ISSUER,
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
  }) as JwtPayload;

  return decoded;
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    issuer: JWT_ISSUER,
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
    issuer: JWT_ISSUER,
  }) as JwtPayload;

  return decoded;
}

export const accessTokenTTLSeconds = ACCESS_TOKEN_TTL_SECONDS;
export const refreshTokenTTLSeconds = REFRESH_TOKEN_TTL_SECONDS;
