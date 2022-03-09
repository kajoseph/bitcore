import crypto from 'crypto';
import config from './config.js';
import logger from './logger.js';
import request from './request.js';
import * as utils from './utils.js';

class OkCoin {
  apiKey;
  apiSecret;
  apiPassphrase;

  baseURL = 'https://www.okcoin.com/api';

  constructor() {
    if (!config.integrations || !config.integrations.okcoin) {
      throw new Error('OKCoin is not configured');
    }
    this.apiKey = config.integrations.okcoin.key;
    this.apiSecret = config.integrations.okcoin.secret;
    this.apiPassphrase = config.integrations.okcoin.passphrase;
  }

  _makeHeaders(path, body) {
    const timestamp = new Date().toISOString();
    const headers = {};
    headers['OK-ACCESS-KEY'] = this.apiKey;
    headers['OK-ACCESS-SIGN'] = this._makeSignature(timestamp, path, body);
    headers['OK-ACCESS-TIMESTAMP'] = timestamp;
    headers['OK-ACCESS-PASSPHRASE'] = this.apiPassphrase;

    return headers;
  }

  _makeSignature(timestamp, path, body) {
    let payload = timestamp + 'GET' + path;

    if (typeof body == 'object') {
      payload += JSON.stringify(body)
    } else {
      payload += body || '';
    }

    const hmac = crypto.createHmac('SHA256', this.apiSecret);
    hmac.update(payload);
    return hmac.digest('base64');
  }

  getLNInvoice(sats) {
    try {
      const btc = utils.satsToBtc(sats);
      const path = `/api/account/v3/deposit-lightning?ccy=BTC&amount=${btc.toString()}`;
      const headers = this._makeHeaders(path);

      const { body } = await request.get(this.baseURL + path, { headers });
      return body.invoice;
    } catch (err) {
      if (!err.statusCode) {
        logger.warn('Unexpected error in getLNInvoice', err);
      }
      return '';
    }
  }

}

export let okcoin = new OkCoin();
export default okcoin;