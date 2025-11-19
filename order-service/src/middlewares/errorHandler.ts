import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.flatten() });
  }

  console.error('Unexpected error', err);
  return res.status(500).json({ message: 'internal error' });
}
