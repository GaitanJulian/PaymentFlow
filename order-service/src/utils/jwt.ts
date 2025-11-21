import jwt, {
  SignOptions,
  JwtPayload as BaseJwtPayload,
  Secret,
} from 'jsonwebtoken';

const JWT_SECRET: Secret = (process.env.JWT_SECRET || 'dev_secret') as Secret;
const JWT_ISSUER = process.env.JWT_ISSUER || 'paymentflow-auth';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export interface JwtPayload extends BaseJwtPayload {
  sub: string; // user id
  role?: 'USER' | 'ADMIN';
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    issuer: JWT_ISSUER,
    // Forzamos el tipo para evitar el conflicto raro de typings
    expiresIn: JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
  }) as JwtPayload;

  return decoded;
}
