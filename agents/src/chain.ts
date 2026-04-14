import { defineChain } from 'viem';

export const xLayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.XLAYER_TESTNET_RPC ?? 'https://xlayertestrpc.okx.com'] },
  },
  blockExplorers: {
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/explorer/xlayer/testnet' },
  },
  testnet: true,
});
