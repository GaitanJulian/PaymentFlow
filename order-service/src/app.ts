import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes';
import { errorHandler } from './middlewares/errorHandler';

type RawBodyRequest = express.Request & {
  rawBody?: Buffer;
};

const app = express();

app.use(cors());

// Capturamos el raw body SOLO para el webhook de pago
app.use(
  express.json({
    verify: (req, _res, buf) => {
      const requestWithRawBody = req as RawBodyRequest & { originalUrl?: string };
      const requestPath = requestWithRawBody.originalUrl ?? requestWithRawBody.url;

      if (requestPath === '/api/webhooks/payment') {
        requestWithRawBody.rawBody = buf;
      }
    },
  })
);

app.use('/api', orderRoutes);
app.use(errorHandler);

export default app;
