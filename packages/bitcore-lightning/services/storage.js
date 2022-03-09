import { EventEmitter } from 'events';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import logger from '../logger.js';
import config from '../config.js';

class StorageService {
  client;
  db;
  connected = false;
  connection = new EventEmitter();
  models = {};

  constructor() {
    this.connection.setMaxListeners(30);
  }

  async start() {
    logger.info('Starting Storage Service');
    return new Promise((resolve, reject) => {
      let { dbUrl, dbName, dbHost, dbPort, dbUser, dbPass } = config.db;
      let auth = dbUser !== '' && dbPass !== '' ? `${dbUser}:${dbPass}@` : '';
      const connectUrl = dbUrl ||  `mongodb://${auth}${dbHost}:${dbPort}/${dbName}?socketTimeoutMS=3600000&noDelay=true`;
      let attemptConnect = async () => {
        return MongoClient.connect(connectUrl, {
          keepAlive: true,
          poolSize: config.maxPoolSize,
          useNewUrlParser: true
        });
      };
      let attempted = 0;
      let attemptConnectId = setInterval(async () => {
        try {
          this.client = await attemptConnect();
          this.db = this.client.db(dbName);
          this.connected = true;
          clearInterval(attemptConnectId);
          await this._registerModels();
          this.connection.emit('CONNECTED');
          logger.info('Sucessfully Started Storage Service');
          resolve(this.client);
        } catch (err) {
          logger.error(err);
          attempted++;
          if (attempted > 5) {
            clearInterval(attemptConnectId);
            reject(new Error('Failed to connect to database'));
          }
        }
      }, 5000);
    });
  }

  async stop() {
    if (this.client) {
      logger.info('Stopping Storage Service');
      await wait(5000);
      this.connected = false;
      await Promise.all(this.modelsConnected);
      await this.client.close();
      this.connection.emit('DISCONNECTED');
    }
  }

  async _registerModels() {
    const dir = fs.readdirSync('./models');
    await Promise.allSettled(dir.map(file => {
      return import('../models/' + file)
        .then(model => {
          const newModel = new model.default(this.db);
          this.models[newModel.collectionName] = newModel;
        })
      }));
  }

  model(modelName) {
    return this.models[modelName.toLowerCase()];
  }
}

export let Storage = new StorageService();
