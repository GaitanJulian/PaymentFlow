import { Router } from 'express';
import {
  createOrderHandler,
  updateOrderStateHandler,
  cancelOrderHandler,
  shipOrderHandler,
  getOrderByIdHandler,
} from '../controllers/orderController';
import { paymentWebhookHandler } from '../controllers/webhookController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { registerHandler, loginHandler, refreshTokenHandler } from '../controllers/authController';

const router = Router();

// Webhook NO va autenticado por JWT (usa firma HMAC)
router.post('/webhooks/payment', paymentWebhookHandler);

router.post('/auth/register', registerHandler);
router.post('/auth/login', loginHandler);
router.post('/auth/refresh', refreshTokenHandler);

// A partir de acá, todo requiere JWT
router.use(authMiddleware);

// Endpoint para probar rápidamente el JWT
router.get('/auth/me', (req, res) => {
  return res.json({
    message: 'JWT valid',
    user: req.user,
  });
});

// CRUD de órdenes
router.post('/orders', createOrderHandler);
router.get('/orders/:orderId', getOrderByIdHandler);
router.patch('/orders/:orderId/state', updateOrderStateHandler);
router.post('/orders/:orderId/cancel', cancelOrderHandler);
router.post('/orders/:orderId/ship', shipOrderHandler);

export default router;
