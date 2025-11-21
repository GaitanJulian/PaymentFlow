import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderState } from '../types/orderState';
import { transitionOrderState } from '../services/orderService';
import { verifyWebhookSignature } from '../utils/webhookSigning';

const paymentWebhookSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  transactionId: z.string(),
});

export async function paymentWebhookHandler(req: Request, res: Response) {
  const rawBody: Buffer | undefined = (req as any).rawBody;
  const signature = req.header('X-Signature') || undefined;

  if (!rawBody || !verifyWebhookSignature(rawBody, signature)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ message: 'invalid signature' });
  }

  try {
    const parsed = paymentWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Invalid webhook payload', parsed.error.flatten());
      return res.status(400).json({ message: 'invalid webhook payload' });
    }

    const payload = parsed.data;

    let nextState: OrderState;
    switch (payload.status) {
      case 'SUCCESS':
        nextState = OrderState.PAID;
        break;
      case 'FAILED':
        nextState = OrderState.FAILED;
        break;
      case 'PENDING':
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
