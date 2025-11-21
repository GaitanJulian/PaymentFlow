import { z } from 'zod';

export const createOrderBodySchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'PEN', 'ARS']),
  paymentMethod: z.enum(['card', 'bank_transfer', 'wallet']),
});

// Lo que realmente usa el servicio incluye el userId
export type CreateOrderBodyDto = z.infer<typeof createOrderBodySchema>;

export interface CreateOrderDto extends CreateOrderBodyDto {
  userId: string;
}
