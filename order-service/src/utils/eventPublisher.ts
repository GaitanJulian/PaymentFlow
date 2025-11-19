import config from '../config';
import { Order } from '@prisma/client';

export async function publishOrderCreated(order: Order): Promise<void> {
  const payload = {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    state: order.state
  };

  try {
    await fetch(config.paymentProviderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': order.id
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('Unable to publish order.created event', { orderId: order.id, error });
  }
}
