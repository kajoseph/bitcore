import os from 'os';
import url from 'url';
import { Key, TssKey } from '@bitpay-labs/bitcore-wallet-client';
import * as prompt from '@clack/prompts';
import { UserCancelled } from '../../errors';
import { getCopayerName, getNetwork, getPassword } from '../../prompts';
import { Utils } from '../../utils';
import type { CommonArgs } from '../../../types/cli';

export async function joinThresholdSigWallet(
  args: CommonArgs<{ mnemonic?: string }> & { chain: string }
) {
  const { wallet, chain, opts } = args;
  const { verbose, mnemonic } = opts;
  
  const network = await getNetwork();
  const copayerName = await getCopayerName();
  const password = await getPassword('Enter a password for the wallet:', { hidden: false });

  let key;
  if (mnemonic) {
    key = new Key({ seedType: 'mnemonic', seedData: mnemonic, password });
  } else {
    key = new Key({ seedType: 'new', password });
  }

  const tss = new TssKey.TssKeyGen({
    chain,
    network,
    baseUrl: url.resolve(opts.host, '/bws/api'),
    key,
    password
  });
  
  // Step 1: Show the joining party their auth public key
  // This key must be shared with the session leader so they can create a join code
  // for this specific party (the join code is encrypted with this key)
  const authPubKey = tss.getAuthPublicKey();

  prompt.intro('TSS Join Setup');
  prompt.note([
    'Your authentication public key is generated below.',
    '',
    'Share this key with the session leader (the person who created',
    'the TSS wallet session). They will use it to generate a join',
    'code that only you can use to join.',
    '',
    'Workflow:',
    '  1. Copy the key below',
    '  2. Share it with the session leader (via chat, etc.)',
    '  3. The session leader will give you a join code',
    '  4. Paste the join code below and press Enter',
    '  5. Both you and the session leader must keep your terminals',
    '     open while TSS rounds complete on the server.',
  ].join(os.EOL), 'TSS Join Instructions');

  const done = await prompt.select({
    message: `Your auth public key:${os.EOL}${Utils.colorText(authPubKey, 'blue')}`,
    options: [{ label: 'I have shared this key with the session leader → Continue →', value: true }]
  });
  if (prompt.isCancel(done)) {
    throw new UserCancelled();
  }

  const joinCode = await prompt.text({
    message: 'Enter the join code from the session leader:',
    placeholder: 'Paste the join code received from the session leader',
    validate: (code) => {
      try {
        const decryptedJoinCode = tss.checkJoinCode({ code });
        if (decryptedJoinCode.chain.toLowerCase() !== chain || decryptedJoinCode.network.toLowerCase() !== network) {
          return `Join code chain + network (${decryptedJoinCode.chain}:${decryptedJoinCode.network}) does not match what you specified for this wallet (${chain}:${network}).`;
        }
        return null; // Valid join code
      } catch (err) {
        return 'Invalid join code: ' + (verbose ? err.stack : err.message);
      }
    }
  });
  if (prompt.isCancel(joinCode)) {
    throw new UserCancelled();
  }

  if (verbose) {
    const decryptedJoinCode = tss.checkJoinCode({ code: joinCode });
    const ans = await prompt.confirm({
      message: `${JSON.stringify(decryptedJoinCode, null, 2)}${os.EOL}Is this correct?`,
      initialValue: true,
    });
    if (prompt.isCancel(ans) || !ans) {
      throw new UserCancelled();
    }
  }

  await tss.joinKey({ code: joinCode });

  const spinner = prompt.spinner({ indicator: 'timer' });
  spinner.start('Waiting for all parties to join...');

  await new Promise<void>((resolve, reject) => {
    process.on('SIGINT', () => {
      tss.unsubscribe();
      spinner.stop('Cancelled by user');
      reject(new UserCancelled());
    });
    tss.subscribe({ copayerName });
    tss.on('roundsubmitted', (round) => spinner.message(`Round ${round} submitted`));
    tss.on('error', prompt.log.error);
    tss.on('wallet', async (_wallet) => {
      // TOOD: what to do with this?
      // console.log('Joined wallet at BWS:', wallet);
    });
    tss.on('complete', async () => {
      try {
        spinner.stop('TSS Key Generation Complete!');
        
        const key = tss.getTssKey(password);
        await wallet.createFromTss({
          key,
          chain,
          network,
          password,
          copayerName
        });

        verbose && prompt.log.step(`Wallet file saved to: ${Utils.colorText(wallet.filename, 'blue')}`);

        // const pubKey = CWC.BitcoreLib.HDPublicKey(key.getXPubKey()).publicKey;
        // const address = CWC.Deriver.getAddress(chain, network, pubKey);
        // console.log('Address:', address);

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  return {
    mnemonic: key.get(password).mnemonic
  };
}