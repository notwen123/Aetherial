import { defineChain } from 'viem';

export const xLayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.XLAYER_TESTNET_RPC ?? 'https://testrpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'OKX OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
  testnet: true,
});
