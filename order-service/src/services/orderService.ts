import prisma from '../prisma/client';
import { CreateOrderDto } from '../dto/createOrder.dto';
import { OrderState } from '../types/orderState';
import { publishOrderCreated } from '../utils/eventPublisher';
import { Order } from '@prisma/client';

export async function createOrder(dto: CreateOrderDto) {
  const order = await prisma.order.create({
    data: {
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: dto.paymentMethod
    }
  });

  void publishOrderCreated(order);
  return order;
}

export async function transitionOrderState(orderId: string, targetState: OrderState) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { state: targetState }
  });
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
  });
}

export async function cancelOrder(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { state: OrderState.CANCELED },
  });
}

export async function shipOrder(orderId: string) {
  // Podrías chequear que esté PAID primero si quieres
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.state !== OrderState.PAID) {
    throw new Error('Order must be PAID before shipping');
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { state: OrderState.SHIPPED },
  });
}