import { KeyGen } from './ecdsa/keygen.js';
import { Sign } from './ecdsa/sign.js';

export * as utils from './ecdsa/utils.js';
export * as ECIES from './ecies/ecies.js';

export const ECDSA = {
  KeyGen,
  Sign,
};
