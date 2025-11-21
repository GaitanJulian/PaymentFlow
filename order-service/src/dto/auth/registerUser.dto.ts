import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
