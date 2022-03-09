import cryptoRpc from 'crypto-rpc';
import config from '../config.js';
import { Notifier } from '../notifier.js';
import { Storage } from '../services/storage.js'
import logger from '../logger.js';

const { CryptoRpc } = cryptoRpc;


class ChannelEventMonitor extends Notifier {
  rpc;
  config;

  constructor() {
    super(config.monitors.channelEvents);
    this.rpc = new CryptoRpc({
      chain: 'LNBTC',
      host: config.rpc.host,
      rpcPort: config.rpc.port,
      cert: config.rpc.cert,
      macaroon: config.rpc.macaroon
    }).get('LNBTC');

    this.config = config.monitors.channelEvents;
  }

  async start() {
    const sub = await this.rpc.asyncCall('subscribeToChannels');

    const getPeerData = async (pubKey) => {
      const partnerNode = await this.rpc.asyncCall('getNode', [{ public_key: pubKey }]);
      const peerData = {
        alias: partnerNode.alias,
        totalCapacity: partnerNode.capacity,
        channelCount: partnerNode.channel_count,
        color: partnerNode.color,
        features: partnerNode.features.map(f => ({ bit: f.bit, type: f.type })),
        lastKnownUpdate: new Date(partnerNode.updated_at)
      };
      return peerData;
    }

    sub.on('channel_opened', async (evt) => {
      await Storage.model('Channels').addChannel(evt);

      const data = {
        peerData: await getPeerData(evt.partner_public_key),
        channelData: {
          id: evt.id,
          capacity: evt.capacity,
          isPrivate: Boolean(evt.is_private),
          isPartnerInitiated: Boolean(evt.is_partner_initiated),
          ourBalance: evt.local_balance,
          theirBalance: evt.remote_balance,
          txId: evt.transaction_id,
          txOutputIdx: evt.transaction_vout,
        }
      }
      this._sendChannelEventNotification('openChannel', data)
        .catch(err => logger.error('Unexpected error trying to send channel open notification', err));
    });

    sub.on('channel_closed', async (evt) => {
      await Storage.model('Channels').closeChannel(evt);

      // TODO: store in db
      const data = {
        peerData: await getPeerData(evt.partner_public_key),
        channelData: {
          id: evt.id,
          capacity: evt.capacity,
          isPrivate: Boolean(evt.is_private),
          isPartnerInitiated: Boolean(evt.is_partner_initiated),
          ourBalance: evt.local_balance,
          theirBalance: evt.remote_balance,
          txId: evt.transaction_id,
          txOutputIdx: evt.transaction_vout,
        }
      }
      this._sendChannelEventNotification('closeChannel', data)
        .catch(err => logger.error('Unexpected error trying to send channel close notification', err));
    });

    sub.on('channel_active_changed', async (evt) => {
      // Get channel from db
      const longChannelId = `${evt.transaction_id}:${evt.transaction_vout}`;
      const channel = await Storage.model('Channels').findOne({ longChannelId });
      if (!channel) {
        return logger.warn('Activity detected for missing channel: ' + longChannelId);
      }

      await Storage.model('Channels').setActive(longChannelId, evt.is_active);

      const data = {
        peerData: await getPeerData(channel.partnerPublicKey),
        channelData: {
          isActive: evt.is_active,
          newChannelState: evt.is_active ? 'active' : 'inactive',
          capacity: channel.capacity,
          ourBalance: channel.localBalance,
          theirBalance: channel.remoteBalance
        }
      }

      this._sendChannelEventNotification('changeChannel', data)
        .catch(err => logger.error('Unexpected error trying to send channel change notification', err));
    });
  }

  async _sendChannelEventNotification(event, data) {
    let hasConfig = this.config.enabled && this.config.notify.find(evt => evt === event);
    if (!hasConfig) {
      return;
    }
    return this._sendNotification(event, data, this.config);
  }

}

export default new ChannelEventMonitor();