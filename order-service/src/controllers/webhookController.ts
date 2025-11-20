import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderState } from '../types/orderState';
import { transitionOrderState } from '../services/orderService';

const paymentWebhookSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  transactionId: z.string(),
});

export async function paymentWebhookHandler(req: Request, res: Response) {
  try {
    const payload = paymentWebhookSchema.parse(req.body);

    let nextState: OrderState;
    switch (payload.status) {
      case 'SUCCESS':
        nextState = OrderState.PAID;
        break;
      case 'FAILED':
        nextState = OrderState.FAILED;
        break;
      default:
        nextState = OrderState.PENDING;
        break;
    }

    await transitionOrderState(payload.orderId, nextState);

    return res.status(204).send();
  } catch (err) {
    console.error('Error handling payment webhook', err);
    return res.status(400).json({ message: 'invalid webhook payload' });
  }
}
