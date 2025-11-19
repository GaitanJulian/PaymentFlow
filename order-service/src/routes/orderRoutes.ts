import { Router } from 'express';
import {
  createOrderHandler,
  updateOrderStateHandler,
  paymentWebhookHandler
} from '../controllers/orderController';

const router = Router();

// API principal
router.post('/orders', createOrderHandler);
router.patch('/orders/:orderId/state', updateOrderStateHandler);

// Webhook que llama el Payment Service
router.post('/webhooks/payment', paymentWebhookHandler);

export default router;
