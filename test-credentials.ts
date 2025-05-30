import { Credentials } from './packages/bitcore-wallet-client/src/lib/credentials';

/**
 * Diagnostic function to test Credentials.fromDerivedKey
 */
function testFromDerivedKey() {
  // Test data - using realistic-looking values for a Bitcoin testnet wallet
  const testOpts = {
    chain: 'btc',
    network: 'testnet',
    account: 0,
    xPubKey: 'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp',
    rootPath: "m/44'/1'/0'",
    keyId: 'test-key-id-123',
    requestPrivKey: 'cSBnVM4xvxarwGQuAfQFwqDg9k79jNNzQRHP6w8ksGqGDYrz8J6d',
    // Optional parameters
    n: 1,
    addressType: 'P2PKH',
    walletPrivKey: 'cSBnVM4xvxarwGQuAfQFwqDg9k79jNNzQRHP6w8ksGqGDYrz8J6d',
    clientDerivedPublicKey: '03a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd'
  };

  /**
   * 1) Scroll over both methods. fromDerivedKey, which now doesn't have jsdocs, clearly still provides the useful information for calling.
   * Additionally, `Credentials.fromDerivedKey({}) will enable the IDE to add missing properties. Not so w/ the non typed params version
   * 
   * 2) Comment out one of the required properties (e.g. 'chain') from testOpts. fromDerivedKey complains (appropriate TS behavior), fromDerivedKey_WOTypeSafety doesn't.
   */

  Credentials.fromDerivedKey(testOpts);
  Credentials.fromDerivedKey_WOTypeSafety(testOpts);

  Credentials.fromDerivedKey({});

  Credentials.fromDerivedKey_WOTypeSafety({});
}