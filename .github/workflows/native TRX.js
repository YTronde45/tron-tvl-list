// send 1 TRX
const tx = await tronWeb.trx.sendTransaction(DEST, 1_000_000); // 1,000,000 SUN = 1 TRX
console.log(tx);
