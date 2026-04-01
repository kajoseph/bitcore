import { spawn } from 'child_process';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import * as helpers from './helpers';
import { Wallet } from '../src/wallet';

describe('Create', function() {
  this.timeout(Math.max(this['_timeout'] || 0, 5000));

  const { KEYSTROKES, WALLETS, OUTPUT_END_SEQ } = helpers.CONSTANTS;
  const { CLI_EXEC, CLI_OPTS, COMMON_OPTS, TEMP_DIR } = WALLETS;
  const commonOpts = [...COMMON_OPTS, '--dir', TEMP_DIR];

  before(async function() {
    helpers.cleanupTempWallets();
    await helpers.startBws();
  });

  after(async function() {
    await helpers.stopBws();
  });

  describe('Single Sig', function() {
    it('should create a BTC wallet', function(done) {
      const walletName = 'btc-temp';
      const stepInputs = [
        [KEYSTROKES.ENTER], // Create Wallet
        [KEYSTROKES.ENTER], // Chain: btc
        ['testnet', KEYSTROKES.ENTER], // Network: testnet
        [KEYSTROKES.ENTER], // Multi-party? No
        [KEYSTROKES.ENTER], // Address Type: default
        ['testpassword', KEYSTROKES.ENTER], // Password
        [KEYSTROKES.ENTER], // View mnemonic
        [':', 'q', KEYSTROKES.ENTER] // vim input to quit viewing mnemonic
      ];
      let step = 0;
      const io = new Transform({
        encoding: 'utf-8',
        transform(chunk, encoding, respond) {
          chunk = chunk.toString();
          // Uncomment to see CLI output during test
          // process.stdout.write(chunk);

          const isStep = chunk.endsWith(OUTPUT_END_SEQ) || step == stepInputs.length - 1; // viewing mnemonic (vim)
          if (isStep) {
            for (const input of stepInputs[step]) {
              this.push(input);
            }
            step++;
          } else if (chunk.includes('Error:')) {
            return respond(chunk);
          } else if (chunk.endsWith(' created successfully!\n\n')) {
            child.stdin.end(); // send EOF to child so it can exit cleanly
          }
          respond();
        }
      });
      const child = spawn('node', [CLI_EXEC, walletName, ...commonOpts], CLI_OPTS);
      child.stderr.pipe(process.stderr);
      child.stdout.pipe(io).pipe(child.stdin);
      io.on('error', (e) => {
        done(e);
      });
      child.on('error', (e) => {
        done(e);
      });
      child.on('close', (code) => {
        assert.equal(code, 0);
        const wallet = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, walletName + '.json'), 'utf-8'));
        assert.strictEqual(wallet.credentials.chain, 'btc');
        assert.strictEqual(wallet.credentials.network, 'testnet');
        // Ensure that sensitive wallet key properties are encrypted and not present in plaintext
        assert.ok(Object.hasOwn(wallet.key, 'mnemonicEncrypted'));
        assert.ok(!Object.hasOwn(wallet.key, 'mnemonic'));
        assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEncrypted'));
        assert.ok(!Object.hasOwn(wallet.key, 'xPrivKey'));
        assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEDDSAEncrypted'));
        assert.ok(!Object.hasOwn(wallet.key, 'xPrivKeyEDDSA'));
        done();
      });
    });

    it('should create an ETH wallet', function(done) {
      const walletName = 'eth-temp';
      const stepInputs = [
        [KEYSTROKES.ENTER], // Create Wallet
        ['eth', KEYSTROKES.ENTER], // Chain: eth
        ['testnet', KEYSTROKES.ENTER], // Network: testnet
        [KEYSTROKES.ENTER], // Multi-party? No
        [KEYSTROKES.ENTER], // Address Type: default
        ['testpassword', KEYSTROKES.ENTER], // Password
        [KEYSTROKES.ENTER], // View mnemonic
        [':', 'q', KEYSTROKES.ENTER] // vim input to quit viewing mnemonic
      ];
      let step = 0;
      const io = new Transform({
        encoding: 'utf-8',
        transform(chunk, encoding, respond) {
          chunk = chunk.toString();
          // Uncomment to see CLI output during test
          // process.stdout.write(chunk);

          const isStep = chunk.endsWith(OUTPUT_END_SEQ) || step == stepInputs.length - 1; // viewing mnemonic (vim)
          if (isStep) {
            for (const input of stepInputs[step]) {
              this.push(input);
            }
            step++;
          } else if (chunk.includes('Error:')) {
            return respond(chunk);
          } else if (chunk.endsWith(' created successfully!\n\n')) {
            child.stdin.end(); // send EOF to child so it can exit cleanly
          }
          respond();
        }
      });
      const child = spawn('node', [CLI_EXEC, walletName, ...commonOpts], CLI_OPTS);
      child.stderr.pipe(process.stderr);
      child.stdout.pipe(io).pipe(child.stdin);
      io.on('error', (e) => {
        done(e);
      });
      child.on('error', (e) => {
        done(e);
      });
      child.on('close', (code) => {
        assert.equal(code, 0);
        const wallet = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, walletName + '.json'), 'utf-8'));
        assert.strictEqual(wallet.credentials.chain, 'eth');
        assert.strictEqual(wallet.credentials.network, 'testnet');
        // Ensure that sensitive wallet key properties are encrypted and not present in plaintext
        assert.ok(Object.hasOwn(wallet.key, 'mnemonicEncrypted'));
        assert.ok(!Object.hasOwn(wallet.key, 'mnemonic'));
        assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEncrypted'));
        assert.ok(!Object.hasOwn(wallet.key, 'xPrivKey'));
        assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEDDSAEncrypted'));
        assert.ok(!Object.hasOwn(wallet.key, 'xPrivKeyEDDSA'));
        done();
      });
    });
  });

  describe('Multi Sig', function() {
    describe('BTC', function() {
      let secret: string;
      const walletName1 = 'btc-multisig-temp1';
      const walletName2 = 'btc-multisig-temp2';

      it('should create a multi-sig BTC wallet - copayer1', function(done) {
        const stepInputs = [
          [KEYSTROKES.ENTER], // Create Wallet
          [KEYSTROKES.ENTER], // Chain: btc
          ['testnet', KEYSTROKES.ENTER], // Network: testnet
          [KEYSTROKES.ARROW_LEFT, KEYSTROKES.ENTER], // Multi-party? Yes
          [KEYSTROKES.ENTER], // Which scheme? MultiSig (default)
          ['2-2', KEYSTROKES.ENTER], // M-N: 2-2
          ['copayer1', KEYSTROKES.ENTER], // Copayer name
          [KEYSTROKES.ENTER], // Address Type: default
          ['testpassword', KEYSTROKES.ENTER], // Password
          [KEYSTROKES.ENTER], // Done sharing -- (checkpoint1)
          // Checkpoint1: Get secret to share with copayer 2
          [KEYSTROKES.ENTER], // View mnemonic
          [':', 'q', KEYSTROKES.ENTER] // vim input to quit viewing mnemonic
        ];
        let step = 0;
        let checkpointOutput = '';
        // stepInputs indexes corresponding to checkpoints in test flow where we want to assert on CLI output
        const checkpoints = new Set([10]);
        const io = new Transform({
          encoding: 'utf-8',
          transform(chunk, encoding, respond) {
            chunk = chunk.toString();
            if (checkpoints.has(step)) {
              checkpointOutput += chunk;
            } else {
              checkpointOutput = '';
            }
            // Uncomment to see CLI output during test
            // process.stdout.write(chunk);

            const isStep = chunk.endsWith(OUTPUT_END_SEQ) || step == stepInputs.length - 1; // viewing mnemonic
            if (isStep) {
              for (const input of stepInputs[step]) {
                this.push(input);
              }
              switch (step) {
                default:
                  break; // no-op for non-checkpoint steps
                case Array.from(checkpoints)[0]:
                  const lines = checkpointOutput.split('\n');
                  const startIdx = lines.findIndex(l => l.includes('Share this secret with the other participants:'));
                  assert.ok(startIdx > -1);
                  secret = helpers.decolor(lines[startIdx + 1].trim());
                  assert.match(secret, /^[0-9A-z]{64,}$/); // base58 string at least 64 chars long
                  assert.ok(secret.endsWith('Tbtc')); // testnet btc
                  checkpointOutput = '';
                  break;
              }
              step++;
            } else if (chunk.includes('Error:')) {
              return respond(chunk);
            } else if (chunk.endsWith(' created successfully!\n\n')) {
              child.stdin.end(); // send EOF to child so it can exit cleanly
            }
            respond();
          }
        });
        const child = spawn('node', [CLI_EXEC, walletName1, ...commonOpts], CLI_OPTS);
        child.stderr.pipe(process.stderr);
        child.stdout.pipe(io).pipe(child.stdin);
        io.on('error', (e) => {
          done(e);
        });
        child.on('error', (e) => {
          done(e);
        });
        child.on('close', (code) => {
          assert.equal(code, 0);
          const wallet = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, walletName1 + '.json'), 'utf-8'));
          assert.strictEqual(wallet.credentials.chain, 'btc');
          assert.strictEqual(wallet.credentials.network, 'testnet');
          assert.strictEqual(wallet.credentials.m, 2);
          assert.strictEqual(wallet.credentials.n, 2);
          // Ensure that sensitive wallet key properties are encrypted and not present in plaintext
          assert.ok(Object.hasOwn(wallet.key, 'mnemonicEncrypted'));
          assert.ok(!Object.hasOwn(wallet.key, 'mnemonic'));
          assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEncrypted'));
          assert.ok(!Object.hasOwn(wallet.key, 'xPrivKey'));
          assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEDDSAEncrypted'));
          assert.ok(!Object.hasOwn(wallet.key, 'xPrivKeyEDDSA'));
          done();
        });
      });

      it('should create a multi-sig BTC wallet - copayer2', function(done) {
        const stepInputs = [
          [KEYSTROKES.ARROW_DOWN], // Create Wallet -> Join Wallet
          [KEYSTROKES.ENTER], // Join Wallet
          [KEYSTROKES.ENTER], // Chain: btc
          [KEYSTROKES.ENTER], // Which scheme? MultiSig (default)
          [secret, KEYSTROKES.ENTER], // Enter secret created by copayer 1
          ['copayer2', KEYSTROKES.ENTER], // Copayer name
          ['testpassword', KEYSTROKES.ENTER], // Password
          [KEYSTROKES.ENTER], // View mnemonic
          [':', 'q', KEYSTROKES.ENTER] // vim input to quit viewing mnemonic
        ];
        let step = 0;
        let checkpointOutput = '';
        // stepInputs indexes corresponding to checkpoints in test flow where we want to assert on CLI output
        const checkpoints = new Set([]);
        const io = new Transform({
          encoding: 'utf-8',
          transform(chunk, encoding, respond) {
            chunk = chunk.toString();
            if (checkpoints.has(step)) {
              checkpointOutput += chunk;
            } else {
              checkpointOutput = '';
            }
            // Uncomment to see CLI output during test
            // process.stdout.write(chunk);

            const isStep = chunk.endsWith(OUTPUT_END_SEQ) || step == stepInputs.length - 1; // viewing mnemonic (vim)
            if (isStep) {
              for (const input of stepInputs[step]) {
                this.push(input);
              }
              switch (step) {
                default:
                  break; // no-op for non-checkpoint steps
                case Array.from(checkpoints)[0]:
                  return respond(new Error('No checkpoints expected'));
              }
              step++;
            } else if (chunk.includes('Error:')) {
              return respond(chunk);
            } else if (chunk.endsWith(' created successfully!\n\n')) {
              child.stdin.end(); // send EOF to child so it can exit cleanly
            }
            respond();
          }
        });
        const child = spawn('node', [CLI_EXEC, walletName2, ...commonOpts], CLI_OPTS);
        child.stderr.pipe(process.stderr);
        child.stdout.pipe(io).pipe(child.stdin);
        io.on('error', (e) => {
          done(e);
        });
        child.on('error', (e) => {
          done(e);
        });
        child.on('close', async (code) => {
          try {
            assert.equal(code, 0);
            const wallet = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, walletName2 + '.json'), 'utf-8'));
            assert.strictEqual(wallet.credentials.chain, 'btc');
            assert.strictEqual(wallet.credentials.network, 'testnet');
            assert.strictEqual(wallet.credentials.m, 2);
            assert.strictEqual(wallet.credentials.n, 2);
            assert.strictEqual(wallet.credentials.publicKeyRing.length, 2);
            // Ensure that sensitive wallet key properties are encrypted and not present in plaintext
            assert.ok(Object.hasOwn(wallet.key, 'mnemonicEncrypted'));
            assert.ok(!Object.hasOwn(wallet.key, 'mnemonic'));
            assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEncrypted'));
            assert.ok(!Object.hasOwn(wallet.key, 'xPrivKey'));
            assert.ok(Object.hasOwn(wallet.key, 'xPrivKeyEDDSAEncrypted'));
            assert.ok(!Object.hasOwn(wallet.key, 'xPrivKeyEDDSA'));
            
            // Check that copayer1's wallet file gets updated with copayer2's public key info
            const copayer1_beforeLoad = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, walletName1 + '.json'), 'utf-8'));
            assert.strictEqual(copayer1_beforeLoad.credentials.publicKeyRing.length, 1);
            const w = new Wallet({ name: walletName1, dir: TEMP_DIR, host: commonOpts[commonOpts.indexOf('--host') + 1] });
            // Calls w.load() which should update wallet with client.openWallet() response
            await w.getClient({ mustExist: true });
            const copayer1_afterLoad = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, walletName1 + '.json'), 'utf-8'));
            assert.strictEqual(copayer1_afterLoad.credentials.publicKeyRing.length, 2);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });

    describe('Non-multisig Chains', function() {
      for (const chain of ['eth', 'xrp', 'sol']) {
        it(`should not offer MultiSig option for ${chain.toUpperCase()}`, function(done) {
          const walletName = `${chain}-multisig-temp`;
          const stepInputs = [
            [KEYSTROKES.ENTER], // Create Wallet
            [chain, KEYSTROKES.ENTER], // Chain: <chain>
            ['testnet', KEYSTROKES.ENTER], // Network: testnet
            [KEYSTROKES.ARROW_LEFT, KEYSTROKES.ENTER], // Multi-party? Yes
            // Checkpoint1: Verify that MultiSig is not presented as an option
            [KEYSTROKES.CTRL_C], // M-N (cancel out) -- (checkpoint1)
          ];
          let step = 0;
          let checkpointOutput = '';
          // stepInputs indexes corresponding to checkpoints in test flow where we want to assert on CLI output
          const checkpoints = new Set([4]);
          const io = new Transform({
            encoding: 'utf-8',
            transform(chunk, encoding, respond) {
              chunk = chunk.toString();
              if (checkpoints.has(step)) {
                checkpointOutput += chunk;
              } else {
                checkpointOutput = '';
              }
              // Uncomment to see CLI output during test
              // process.stdout.write(chunk);

              const isStep = chunk.endsWith(OUTPUT_END_SEQ);
              if (isStep) {
                for (const input of stepInputs[step]) {
                  this.push(input);
                }
                switch (step) {
                  default:
                    break; // no-op for non-checkpoint steps
                  case Array.from(checkpoints)[0]:
                    // Asked if it's multi-party
                    assert.match(checkpointOutput, /Is this a multi-party wallet\?/);
                    // Asked for m-n
                    assert.match(checkpointOutput, /M-N:/);
                    // Should NOT have prompted multi-party scheme options (MultiSig, TSS, etc)
                    assert.doesNotMatch(checkpointOutput, /MultiSig|TSS/);
                    checkpointOutput = '';
                    break;
                }
                step++;
              } else if (chunk.includes('Error:')) {
                assert.match(chunk, /Error: Cancelled by user/);
                assert.ok(step > stepInputs.length - 1); // Ensure that flow was cancelled at end of steps
                child.stdin.end(); // send EOF to child so it can exit cleanly
              }
              respond();
            }
          });
          const child = spawn('node', [CLI_EXEC, walletName, ...commonOpts], CLI_OPTS);
          child.stderr.pipe(process.stderr);
          child.stdout.pipe(io).pipe(child.stdin);
          io.on('error', (e) => {
            done(e);
          });
          child.on('error', (e) => {
            done(e);
          });
          child.on('close', (code) => {
            assert.equal(code, 1); // Exit code 1 since flow is cancelled with ctrl+c
            // No wallet file should have been created or saved
            assert.ok(!fs.existsSync(path.join(TEMP_DIR, walletName + '.json')));
            done();
          });
        });
      }
    });
  });
});