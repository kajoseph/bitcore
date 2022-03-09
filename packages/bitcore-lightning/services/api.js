import crypto from 'crypto';
import https from 'https'
import logger from '../logger.js';

class ApiService {
  constructor() {}

  async start() {
    logger.info('Starting API Service');

    await import('../routes/index.js');

    logger.info('Sucessfully Started API Service');
  }
}

export let Api = new ApiService();