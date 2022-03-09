import os from 'os';
import fs from 'fs';


// override any field in bitcore.config.json by maintaining the same object structure on a "lightning" key.
const defaultConfig = {
  rpc: {
    host: 'localhost',
    port: 10008,
    tls: `${os.homedir()}/.lnd/tls.cert`,
    macaroon: `${os.homedir}/.lnd/data/chain/bitcoin/mainnet/admin.macaroon`
  },
  db: {
    dbUrl: process.env.DB_URL || '',
    dbHost: process.env.DB_HOST || '127.0.0.1',
    dbName: process.env.DB_NAME || 'bitcore-lightning',
    dbPort: process.env.DB_PORT || '27017',
    dbUser: process.env.DB_USER || '',
    dbPass: process.env.DB_PASS || '',
    maxPoolSize: 50
  },
  api: {
    port: 3100,
    authKey: 'example',
    headerPrefix: 'bc-lightning-',
    cors: { origin: 'http://localhost' }
  },
  log: {
    file: './logs/output.log',
    level: 'debug'
  },
  monitors: {
    channelEvents: {
      url: 'https://example.com',
      signingKey: undefined,
      headerPrefix: 'x-bitcore-ln-',
      events: []
    }
  },
  integrations: {
    // here for documentation only
    /*
    okcoin: {
      key: 'api key goes here',
      secret: 'api secret goes here',
      passphrase: 'api passphrase goes here'
    },
    bitfinex: {
      key: 'api key goes here',
      secret: 'api key goes here',
    }
    */
  }
}

function mergeConfig(defaultConfig, specificConfig = {}) {
  for (let key of Object.keys(defaultConfig)) {
    let val = defaultConfig[key];
    if (typeof val === 'object' && !Array.isArray(val)) {
      val = mergeConfig(val, specificConfig[key] || {});
    } else {
      val = specificConfig[key] || val;
    }
    delete specificConfig[key]; // this prevents the Object.assign below from doing a shallow merge and overwriting what we've done here

    defaultConfig[key] = val;
  }

  return Object.assign(defaultConfig, specificConfig); // Adds any other keys from specificConfig that defaultConfig might not have
}

function buildConfig(defaultConfig, specificConfig = {}) {
  const config = mergeConfig(defaultConfig, specificConfig);

  if (fs.existsSync(config.rpc.cert)) {
    config.rpc.cert = fs.readFileSync(config.rpc.cert).toString('base64');
  }

  if (fs.existsSync(config.rpc.macaroon)) {
    config.rpc.macaroon = fs.readFileSync(config.rpc.macaroon).toString('base64');
  }

  return config;
}

let bitcoreConfig = {};
const bitcoreConfigPath = '../../bitcore.config.json';
if (fs.existsSync(bitcoreConfigPath)) {
  bitcoreConfig = JSON.parse(fs.readFileSync(bitcoreConfigPath).toString());  
}

export const config = buildConfig(defaultConfig, bitcoreConfig.lightning);
export default config;

export const api = config.api;
export const rpc = config.rpc;
export const db  = config.db;
export const log = config.log;
export const monitors = config.monitors;