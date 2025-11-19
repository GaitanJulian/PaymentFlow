import app from './app';
import config from './config';

app.listen(config.port, () => {
  console.info(`Order Service listening on port ${config.port}`);
});
