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
