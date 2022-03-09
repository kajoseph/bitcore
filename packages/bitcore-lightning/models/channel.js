import mongodb from 'mongodb';

class ChannelsModel extends mongodb.Collection {
  constructor(db, options) {
    super(db, 'channels', options);
    this.createIndex({ longChannelId: 1 }, { unique: true });
    this.createIndex({ shortChannelId: 1 });
    this.createIndex({ partnerPublicKey: 1, isActive: 1 });
    this.createIndex({ isActive: 1 });
  }

  async addChannel(newChannel) {
    await this.insertOne({
      partnerPublicKey: newChannel.partner_public_key,
      longChannelId: `${newChannel.transaction_id}:${newChannel.transaction_vout}`,
      shortChannelId: newChannel.id,
      isActive: newChannel.is_active,
      isPrivate: newChannel.is_private,
      isClosed: false,
      localBalance: newChannel.local_balance,
      remoteBalance: newChannel.remote_balance,
      openEvent: newChannel
    });
  }

  async closeChannel(closeEvent) {
    await this.updateOne({
      partnerPubKey: closeEvent.partner_public_key,
      longChannelId: `${closeEvent.transaction_id}:${closeEvent.transaction_vout}`
    }, {
      $set: {
        isClosed: true,
        closeEvent: closeEvent
      }
    });
  }

  async setActive(longChannelId, isActive) {
    await this.updateOne({
      longChannelId
    }, {
      $set: {
        isActive
      }
    })
  }
}

export default ChannelsModel;