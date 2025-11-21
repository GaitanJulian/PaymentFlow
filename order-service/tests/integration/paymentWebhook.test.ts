/// <reference types="jest" />

import request from 'supertest';
import app from '../../src/app';
import * as signing from '../../src/utils/webhookSigning';
import * as orderService from '../../src/services/orderService';
import { OrderState } from '../../src/types/orderState';

describe('payment webhook integration', () => {
  const payload = {
    orderId: 'order-1',
    status: 'SUCCESS' as const,
    transactionId: 'tx-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when signature is invalid', async () => {
    const verifySpy = jest
      .spyOn(signing, 'verifyWebhookSignature')
      .mockReturnValue(false);

    const transitionSpy = jest.spyOn(orderService, 'transitionOrderState');

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Signature', 'sha256=invalid-signature')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'invalid signature');

    // Verificamos que se intentó verificar la firma
    expect(verifySpy).toHaveBeenCalled();

    // Y que NUNCA se llamó al cambio de estado
    expect(transitionSpy).not.toHaveBeenCalled();
  });

  it('transitions order to PAID when signature is valid and status=SUCCESS', async () => {
    jest
      .spyOn(signing, 'verifyWebhookSignature')
      .mockReturnValue(true);

    const transitionSpy = jest
  .spyOn(orderService, 'transitionOrderState')
  .mockResolvedValue({
    id: 'order-1',
    userId: 'user-1',
    amount: 100,
    currency: 'USD',
    paymentMethod: 'card',
    state: OrderState.PAID,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: null,
  } as any);

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Signature', 'sha256=valid-signature')
      .send(payload);

    expect(res.status).toBe(204);
    expect(transitionSpy).toHaveBeenCalledWith(payload.orderId, OrderState.PAID);
  });

  it('transitions order to FAILED when signature is valid and status=FAILED', async () => {
    jest
      .spyOn(signing, 'verifyWebhookSignature')
      .mockReturnValue(true);

    const transitionSpy = jest
  .spyOn(orderService, 'transitionOrderState')
  .mockResolvedValue({
    id: 'order-1',
    userId: 'user-1',
    amount: 100,
    currency: 'USD',
    paymentMethod: 'card',
    state: OrderState.FAILED,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: null,
  } as any);

    const failedPayload = {
      ...payload,
      status: 'FAILED' as const,
    };

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Signature', 'sha256=valid-signature')
      .send(failedPayload);

    expect(res.status).toBe(204);
    expect(transitionSpy).toHaveBeenCalledWith(
      failedPayload.orderId,
      OrderState.FAILED
    );
  });
});
