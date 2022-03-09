import { CryptoRpc } from 'crypto-rpc';
import okcoin from '../integrations/okcoin.js';
import { rpc as config } from '../config.js';
import logger from '../logger.js';


const ONE_HOUR = 1000 * 60 * 60;

class ChannelOps {
  rpc;
  constructor() {
    this.rpc = new CryptoRpc({
      chain: 'LNBTC',
      rpcPort: config.port,
      host: config.host,
      cert: config.cert,
      macaroon: config.macaroon
    }).get('LNBTC');
  }

  async pushToExchange(sats, channelId) {
    const lnurl = await okcoin.getLNInvoice(sats);
    
    try {
      const result = await this.rpc.asyncCall('payViaPaymentRequest', [{ request: lnurl, outgoing_channel: channelId }]);
      
    } catch (err) {
      logger.warn('Unable to pay invoice')
    }

  }

  pull(sats, channelId, expiresIn) {
    let expiry = null; // By default, an invoice expires in 1 hour
    if (expiresIn) {
      expiry = new Date(Date.now() + expiresIn).toISOString();
    }
    const { invoice } = await this.rpc.createInvoice({ amount: sats, expiry });
    return invoice.request;
  }

  get(channelId) {
    const { channel } = await this.rpc.asyncCall('getChannel', [{ id: channelId }]);
    return channel;
  }

  async list() {
    const { channels } = await this.rpc.asyncCall('getChannels');
    return channels;
  }

  analyze() {

  }
}