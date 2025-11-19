import { Router } from 'express';
import { createOrderHandler, updateOrderStateHandler } from '../controllers/orderController';

const router = Router();

router.post('/orders', createOrderHandler);
router.patch('/orders/:orderId/state', updateOrderStateHandler);

export default router;
