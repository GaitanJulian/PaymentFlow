import { Request, Response } from 'express';
import { loginUserSchema } from '../dto/auth/loginUser.dto';
import { registerUserSchema } from '../dto/auth/registerUser.dto';
import { refreshTokenSchema } from '../dto/auth/refreshToken.dto';
import {
  registerAndAuthenticate,
  loginAndAuthenticate,
  refreshAuthentication,
} from '../services/authService';

export async function registerHandler(req: Request, res: Response) {
  const payload = registerUserSchema.parse(req.body);

  try {
    const authResponse = await registerAndAuthenticate(payload);
    return res.status(201).json(authResponse);
  } catch (err) {
    console.error('Registration failed', err);
    return res.status(400).json({ message: (err as Error).message || 'registration failed' });
  }
}

export async function loginHandler(req: Request, res: Response) {
  const payload = loginUserSchema.parse(req.body);

  try {
    const authResponse = await loginAndAuthenticate(payload);
    return res.status(200).json(authResponse);
  } catch (err) {
    console.error('Login failed', err);
    return res.status(401).json({ message: (err as Error).message || 'invalid credentials' });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  const { refreshToken } = refreshTokenSchema.parse(req.body);

  try {
    const authResponse = await refreshAuthentication(refreshToken);
    return res.status(200).json(authResponse);
  } catch (err) {
    console.error('Refresh token failed', err);
    return res.status(401).json({ message: (err as Error).message || 'invalid refresh token' });
  }
}
