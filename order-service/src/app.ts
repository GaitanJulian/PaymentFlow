import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', orderRoutes);
app.use(errorHandler);

export default app;
