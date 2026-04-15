import axios from 'axios';
import crypto from 'crypto';
import {
  createWalletClient,
  http,
  publicActions,
  formatUnits,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { xLayerTestnet } from './chain';

// ── Token addresses on X Layer Testnet (chainIndex 196) ─────────────────────
export const OKB_ADDRESS  = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const AUSD_ADDRESS = process.env.AUSD_TOKEN ?? '0xff7CceaEE80c63C11cd50Bf73260D3FA7B5Ab595';

// ── OKX API auth ─────────────────────────────────────────────────────────────
function buildOKXHeaders(method: string, path: string, body = '') {
  const timestamp = new Date().toISOString();
  const prehash  = `${timestamp}${method}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', process.env.OKX_SECRET_KEY ?? '')
    .update(prehash)
    .digest('base64');

  const headers: Record<string, string> = {
    'OK-ACCESS-KEY':       process.env.OKX_API_KEY ?? '',
    'OK-ACCESS-SIGN':      signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE':process.env.OKX_API_PASSPHRASE ?? '',
    'Content-Type':        'application/json',
  };

  if (process.env.OKX_PROJECT_ID) {
    headers['OK-ACCESS-PROJECT'] = process.env.OKX_PROJECT_ID;
  }

  return headers;
}

export interface SwapResult {
  txHash: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  profitUsd: number;
}

export class SwapExecutor {
  private walletAddress: `0x${string}`;
  private client: any;

  constructor() {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY is missing');
    }
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    this.walletAddress = account.address;
    this.client = createWalletClient({
      account,
      chain: xLayerTestnet,
      transport: http(process.env.XLAYER_TESTNET_RPC ?? 'https://testrpc.xlayer.tech'),
    }).extend(publicActions);
  }

  /**
   * Get a swap quote from OKX DEX API.
   */
  async getQuote(
    fromToken: string,
    toToken: string,
    readableAmount: string
  ): Promise<{ toAmount: string; priceImpact: string; gasUsd: string }> {
    if (!process.env.OKX_PROJECT_ID) {
      // Simulate a 0.2% fee + tiny slippage for the demo UI
      const amt = parseFloat(readableAmount);
      return {
        toAmount: (amt * 0.998).toString(),
        priceImpact: '0.02',
        gasUsd: '0.12',
      };
    }

    const path = `/api/v5/dex/aggregator/quote?chainId=196&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${readableAmount}&slippage=0.5`;
    const res = await axios.get(`https://www.okx.com${path}`, {
      headers: buildOKXHeaders('GET', path),
    });

    const data = res.data?.data?.[0];
    if (!data) throw new Error('No quote returned from OKX DEX');

    return {
      toAmount:    data.toTokenAmount ?? '0',
      priceImpact: data.priceImpactPercentage ?? '0',
      gasUsd:      data.estimateGasFee ?? '0',
    };
  }

  /**
   * Execute a swap via OKX DEX API swap endpoint or simulated on-chain wait.
   */
  async executeSwap(
    fromToken: string,
    toToken: string,
    readableAmount: string,
    slippage = '0.5'
  ): Promise<string> {
    if (!process.env.OKX_PROJECT_ID) {
      console.log(`[SwapExecutor] No Project ID. Simulating on-chain execution for ${readableAmount} tokens...`);
      // Simulate delay of a real on-chain transaction
      await new Promise(r => setTimeout(r, 2000));
      return '0x' + crypto.randomBytes(32).toString('hex');
    }

    const swapPath = `/api/v5/dex/aggregator/swap?chainId=196&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${readableAmount}&slippage=${slippage}&userWalletAddress=${this.walletAddress}`;
    const swapRes = await axios.get(`https://www.okx.com${swapPath}`, {
      headers: buildOKXHeaders('GET', swapPath),
    });

    const swapData = swapRes.data?.data?.[0];
    if (!swapData?.tx) throw new Error('No swap tx data returned from OKX DEX');

    const tx = swapData.tx;

    const hash: Hash = await this.client.sendTransaction({
      to:    tx.to as `0x${string}`,
      data:  tx.data as `0x${string}`,
      value: BigInt(tx.value ?? '0'),
      gas:   BigInt(tx.gas ?? '300000'),
    });

    console.log(`[SwapExecutor] Swap tx submitted: ${hash}`);
    const receipt = await this.client.waitForTransactionReceipt({ hash });
    console.log(`[SwapExecutor] Swap confirmed in block ${receipt.blockNumber}`);

    return hash;
  }

  /**
   * Full round-trip strategy: AUSD → OKB → AUSD
   */
  async executeRoundTrip(ausdAmount: string): Promise<SwapResult> {
    const MAX_PRICE_IMPACT = parseFloat(process.env.MAX_PRICE_IMPACT ?? '5.0');

    console.log(`[SwapExecutor] Starting round-trip: ${ausdAmount} AUSD → OKB → AUSD`);

    console.log('[SwapExecutor] Leg 1: Getting AUSD → OKB quote...');
    const leg1Quote = await this.getQuote(AUSD_ADDRESS, OKB_ADDRESS, ausdAmount);
    const priceImpact1 = parseFloat(leg1Quote.priceImpact);

    if (priceImpact1 > MAX_PRICE_IMPACT) {
      throw new Error(`Price impact too high: ${priceImpact1.toFixed(2)}% > ${MAX_PRICE_IMPACT}%`);
    }

    console.log('[SwapExecutor] Executing Leg 1: AUSD → OKB...');
    await this.executeSwap(AUSD_ADDRESS, OKB_ADDRESS, ausdAmount);

    // Minor delay between legs
    await new Promise(r => setTimeout(r, 1000));

    // Calculate leg 2 input based on Leg 1 output (toAmount)
    // If quote returned 0 (simulated/fail), fallback to 99.5% of input
    const leg2StartAmount = leg1Quote.toAmount !== '0' 
      ? leg1Quote.toAmount 
      : (parseFloat(ausdAmount) * 0.995).toString();

    console.log(`[SwapExecutor] Leg 2: Getting OKB → AUSD quote...`);
    const leg2Quote = await this.getQuote(OKB_ADDRESS, AUSD_ADDRESS, leg2StartAmount);
    const priceImpact2 = parseFloat(leg2Quote.priceImpact);

    console.log('[SwapExecutor] Executing Leg 2: OKB → AUSD...');
    const leg2Hash = await this.executeSwap(OKB_ADDRESS, AUSD_ADDRESS, leg2StartAmount);

    const ausdIn  = parseFloat(ausdAmount);
    const ausdOut = parseFloat(leg2Quote.toAmount);
    const profitUsd = ausdOut - ausdIn;

    return {
      txHash:      leg2Hash,
      fromAmount:  ausdAmount,
      toAmount:    ausdOut.toFixed(6),
      priceImpact: Math.max(priceImpact1, priceImpact2).toFixed(3),
      profitUsd,
    };
  }
}

