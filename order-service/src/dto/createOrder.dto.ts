import { z } from 'zod';

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'PEN', 'ARS']),
  paymentMethod: z.enum(['card', 'bank_transfer', 'wallet'])
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
