const ONE_BTC = BigInt(1e8);

export function btcToSats(btc) {
  return BigInt(btc) * ONE_BTC;
}

export function satsToBtc(sats) {
  return BigInt(sats) / ONE_BTC;
}
