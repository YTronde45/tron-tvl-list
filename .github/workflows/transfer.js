// transfer.js
require('dotenv').config();
const TronWeb = require('tronweb');

const fullNode = process.env.FULLNODE || 'https://api.trongrid.io';       // mainnet public node
const solidityNode = process.env.SOLIDITY_NODE || 'https://api.trongrid.io';
const eventServer = process.env.EVENT_SERVER || 'https://api.trongrid.io';
const privateKey = process.env.PRIVATE_KEY; // MUST be kept secret

if (!privateKey) {
  console.error('Set PRIVATE_KEY in .env');
  process.exit(1);
}

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

// destination wallet you provided:
const DEST = 'TFfJEwDFp5adstGi35MrtQiJ6f1FWgQPhd';

// Contracts array & planned amounts (raw token units or human units depending on decimals)
const contracts = [
  { address: 'TFGDbUyP8xez44C76fin3bn3Ss6jugoUwJ', amountHuman: 186666 }, // change as needed
  { address: 'TS7eq88dfxXWigXjpzBpyxZnSeT533XPLu', amountHuman: 186667 },
  { address: 'TCFNp179Lg46D16zKoumd4Poa2WFFdtqYj', amountHuman: 186667 }
];

// Utility: convert human amount to smallest unit using token decimals
async function getDecimals(contractAddr) {
  const contract = await tronWeb.contract().at(contractAddr);
  try {
    const d = await contract.decimals().call();
    return parseInt(d.toString(), 10);
  } catch (e) {
    // if decimals() not present, assume 18 or 6 depending on token; you must confirm
    console.warn(`Could not read decimals for ${contractAddr}, defaulting to 6`);
    return 6;
  }
}

async function transferTRC20(contractAddr, to, amountHuman) {
  const contract = await tronWeb.contract().at(contractAddr);
  const decimals = await getDecimals(contractAddr);
  const amountRaw = tronWeb.toBigNumber(amountHuman).times(tronWeb.toBigNumber(10).pow(decimals)).toString(10);

  console.log(`Sending ${amountHuman} (raw ${amountRaw}) from ${await tronWeb.defaultAddress.base58} to ${to} for contract ${contractAddr}`);
  const tx = await contract.methods.transfer(to, amountRaw).send();
  return tx;
}

(async () => {
  try {
    for (const c of contracts) {
      // You may wish to check balance first:
      try {
        const tokenContract = await tronWeb.contract().at(c.address);
        const balanceRaw = await tokenContract.methods.balanceOf(tronWeb.defaultAddress.base58).call();
        console.log(`Balance of sender for ${c.address}: ${balanceRaw.toString()}`);
      } catch (e) {
        console.warn(`Could not fetch balance for ${c.address}: ${e.message}`);
      }

      const receipt = await transferTRC20(c.address, DEST, c.amountHuman);
      console.log('Transfer tx result:', receipt);
      console.log('Explorer URL (example): https://tronscan.org/#/transaction/' + (receipt.txid || receipt));
      // slight delay recommended between txs if multiple
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('All transfers attempted.');
  } catch (err) {
    console.error('Transfer error:', err);
  }
})();
