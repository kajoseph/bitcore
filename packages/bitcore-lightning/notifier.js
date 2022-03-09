import crypto from 'crypto';
import { IncomingMessage } from 'http';
import logger from './logger.js';
import request from './request.js';

export class Notifier {
  eventConfig;
  constructor(config) {
    if (config.events.length && !config.signingKey) {
      throw new Error('Missing signingKey for monitor');
    }

    this.eventConfig = config;
  }

  async _sendNotification(event, data) {
    try {
      if (!this.eventConfig) {
        return;
      }

      const body = {
        event,
        data
      }

      const timestamp = new Date(Date.now()).toISOString();
      const headers = {};
      headers[this.eventConfig.headerPrefix + 'ts'] = timestamp;
      headers[this.eventConfig.headerPrefix + 'hmac'] = crypto.createHmac('SHA256', this.eventConfig.signingKey)
                                                              .update(timestamp + 'POST' + this.eventConfig.url + JSON.stringify(body))
                                                              .digest('base64');

    
      await request.post(this.eventConfig.url, headers, body);
    } catch (err) {
      let errData = err;
      if (err instanceof IncomingMessage) {
        errData = {
          statusCode: err.statusCode,
          body: err.body
        }
      }
      logger.error('Unable to send notification', { event, error: errData });
    }
  }
}