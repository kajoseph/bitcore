import logger from './logger.js';
import { Storage } from './services/storage.js';
import { Api } from './services/api.js';
import { Monitor } from './services/monitor.js';


process.on('uncaughtException', (err) => logger.error('UncaughtException', err));
process.on('unhandledRejection', (err) => logger.error('UnhandledRejection', err));

Storage
  .start()
  .then(() => {
    Monitor.start();
    Api.start();
  });

