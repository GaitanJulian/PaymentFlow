import { Request, Response } from 'express';
import { createOrderSchema } from '../dto/createOrder.dto';
import { createOrder, transitionOrderState, getOrderById, cancelOrder, shipOrder } from '../services/orderService';
import { OrderState } from '../types/orderState';
import { z } from 'zod';


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


export async function getOrderByIdHandler(req: Request, res: Response) {
  const { orderId } = req.params;

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Error fetching order by id', { error, orderId });
    return res.status(500).json({ message: 'internal error' });
  }
}

export async function cancelOrderHandler(req: Request, res: Response) {
  const paramsSchema = z.object({
    orderId: z.string().uuid(),
  });

  const { orderId } = paramsSchema.parse(req.params);

  try {
    const order = await cancelOrder(orderId);
    return res.status(200).json(order);
  } catch (err) {
    console.error('Error cancelling order', err);
    return res.status(400).json({ message: 'cannot cancel order' });
  }
}

export async function shipOrderHandler(req: Request, res: Response) {
  const paramsSchema = z.object({
    orderId: z.string().uuid(),
  });

  const { orderId } = paramsSchema.parse(req.params);

  try {
    const order = await shipOrder(orderId);
    return res.status(200).json(order);
  } catch (err: any) {
    console.error('Error shipping order', err);
    return res.status(400).json({ message: err?.message || 'cannot ship order' });
  }
}