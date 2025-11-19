import 'dotenv/config';

const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/paymentflow_orders?schema=public',
  orderWebhookSecret: process.env.ORDER_WEBHOOK_SECRET ?? 'change-me',
  paymentProviderUrl:
    process.env.PAYMENT_PROVIDER_URL ?? 'http://localhost:8000/payments'
};

export default config;
