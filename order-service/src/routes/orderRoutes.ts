import { Router } from 'express';
import {
  createOrderHandler,
  updateOrderStateHandler,
  paymentWebhookHandler,
  getOrderByIdHandler,
} from '../controllers/orderController';

const router = Router();


// Webhook que llama el Payment Service
router.post('/webhooks/payment', paymentWebhookHandler);

// Crear orden
router.post('/orders', createOrderHandler);

// Ver orden por id (nuevo)
router.get('/orders/:orderId', getOrderByIdHandler);

// Cambiar estado manualmente (ya existía)
router.patch('/orders/:orderId/state', updateOrderStateHandler);

// Nuevo endpoint para recibir el webhook del payment-service
router.post('/webhooks/payment', paymentWebhookHandler);


export default router;
