/**
 * The official client library for bitcore-wallet-service
 */

/**
 * Client API
 */
import { API } from './lib/api.js';

export default API;

export { API } from './lib/api.js';
export type { Network, CreateWalletOpts, Status, Txp } from './lib/api.js';
export { Credentials } from './lib/credentials.js';
export { PayProV2 } from './lib/payproV2.js';
export { PayPro } from './lib/paypro.js';
export { Key } from './lib/key.js';
export { Verifier } from './lib/verifier.js';
export { Encryption } from './lib/common/encryption.js';
export type * as EncryptionTypes from './lib/common/encryption.js';
export { Utils } from './lib/common/utils.js';
export type * as UtilsTypes from './lib/common/utils.js';
export { Constants } from './lib/common/constants.js';
export type * as ConstantsTypes from './lib/common/constants.js';
export { Errors } from './lib/errors/index.js';
export type { ServerAssistedImportEvents } from './types/serverAssistedImportEvents.js';
export type { Address } from './types/address.js';

export * as TssKey from './lib/tsskey.js';
export * as TssSign from './lib/tsssign.js';