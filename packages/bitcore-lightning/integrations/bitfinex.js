import crypto from 'crypto';
import request from '../request.js';
import * as utils from '../utils.js';
import config from '../config.js';

class Bitfinex {
  apiKey;
  apiSecret;
  
  baseUrl;

  constructor() {
    if (!config.integrations || !config.integrations.bitfinex) {
      throw new Error('Bitfinex is not configured');
    }
    this.apiKey = config.integrations.bitfinex.key;
    this.apiSecret = config.integrations.bitfinex.secret;

    this.baseUrl = 'https://api.bitfinex.com';
  }

  _makeHeaders(path, body) {
    const nonce = (Date.now() * 1000).toString();

    const headers = {};
    headers['bfx-nonce'] = nonce;
    headers['bfx-apikey'] = this.apiKey;
    headers['bfx-signature'] = this._makeSignature(nonce, path, body);
  }

  _makeSignature(nonce, path, body) {
    const payload = `/api/${path}${nonce}${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('SHA384', this.apiSecret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  async getLNInvoice(sats) {
    const path = '/v2/auth/w/deposit/invoice';
    const body = {
      currency: 'LNX',
      wallet: 'exchange',
      amount: utils.satsToBtc(sats)
    };
    const headers = this._makeHeaders(path, body);
    const result = await request.post(this.baseUrl + path, { headers }, body);
    return result.body[1];
  }
}

export let bitfinex = new Bitfinex();
export default bitfinex;