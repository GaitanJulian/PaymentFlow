import { Request, Response } from 'express';
import { createOrderSchema } from '../dto/createOrder.dto';
import { createOrder, transitionOrderState } from '../services/orderService';
import { OrderState } from '../types/orderState';

export async function createOrderHandler(req: Request, res: Response) {
  const payload = createOrderSchema.parse(req.body);
  const order = await createOrder(payload);
  return res.status(201).json(order);
}

export async function updateOrderStateHandler(req: Request, res: Response) {
  const { orderId } = req.params;
  const { state } = req.body;

  if (!Object.values(OrderState).includes(state)) {
    return res.status(400).json({ message: 'invalid state transition' });
  }

  const updated = await transitionOrderState(orderId, state as OrderState);
  return res.json(updated);
}

// Nuevo: webhook que recibe el resultado del pago
export async function paymentWebhookHandler(req: Request, res: Response) {
  const { orderId, status, transactionId } = req.body ?? {};

  if (!orderId || !status) {
    return res.status(400).json({ message: 'missing orderId or status' });
  }

  let targetState: OrderState;

  switch (status) {
    case 'SUCCESS':
      targetState = OrderState.PAID;
      break;
    case 'FAILED':
      targetState = OrderState.FAILED;
      break;
    default:
      return res.status(400).json({ message: 'unknown payment status' });
  }

  try {
    const updated = await transitionOrderState(orderId, targetState);
    return res.status(200).json({
      ok: true,
      order: updated,
      transactionId
    });
  } catch (error) {
    console.error('Error handling payment webhook', { error, orderId, status });
    return res.status(500).json({ message: 'internal error' });
  }
}
