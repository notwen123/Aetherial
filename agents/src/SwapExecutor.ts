import 'dotenv/config';
import { execSync } from 'child_process';
import axios from 'axios';
import crypto from 'crypto';
import {
  createWalletClient,
  http,
  publicActions,
  parseUnits,
  formatUnits,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { xLayerTestnet } from './chain';

// ── Token addresses on X Layer Testnet (chainIndex 196) ─────────────────────
// Native OKB
export const OKB_ADDRESS  = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
// AUSD (our deployed token)
export const AUSD_ADDRESS = process.env.AUSD_TOKEN ?? '0xff7CceaEE80c63C11cd50Bf73260D3FA7B5Ab595';

// ── OKX API auth ─────────────────────────────────────────────────────────────
function buildOKXHeaders(method: string, path: string, body = '') {
  const timestamp = new Date().toISOString();
  const prehash  = `${timestamp}${method}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', process.env.OKX_SECRET_KEY ?? '')
    .update(prehash)
    .digest('base64');
  return {
    'OK-ACCESS-KEY':       process.env.OKX_API_KEY ?? '',
    'OK-ACCESS-SIGN':      signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE':process.env.OKX_API_PASSPHRASE ?? '',
    'OK-ACCESS-PROJECT':   process.env.OKX_PROJECT_ID ?? '',
    'Content-Type':        'application/json',
  };
}

export interface SwapResult {
  txHash: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  profitUsd: number;
}

/**
 * SwapExecutor — executes real token swaps on X Layer via OKX DEX API.
 *
 * Strategy: AUSD → OKB → AUSD
 *   1. Get a quote for AUSD → OKB
 *   2. If price impact < MAX_PRICE_IMPACT, execute the swap
 *   3. Get a quote for OKB → AUSD
 *   4. Execute the return swap
 *   5. Return net profit in AUSD
 *
 * This generates real on-chain DEX volume which feeds back into the
 * CreditEvaluator's alpha score calculation.
 */
export class SwapExecutor {
  private walletAddress: `0x${string}`;
  private client: any;

  constructor() {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    this.walletAddress = account.address;
    this.client = createWalletClient({
      account,
      chain: xLayerTestnet,
      transport: http(process.env.XLAYER_TESTNET_RPC ?? 'https://xlayertestrpc.okx.com'),
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
   * Execute a swap via OKX DEX API swap endpoint.
   * Returns the transaction hash.
   */
  async executeSwap(
    fromToken: string,
    toToken: string,
    readableAmount: string,
    slippage = '0.5'
  ): Promise<string> {
    // 1. Get swap calldata
    const swapPath = `/api/v5/dex/aggregator/swap?chainId=196&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${readableAmount}&slippage=${slippage}&userWalletAddress=${this.walletAddress}`;
    const swapRes = await axios.get(`https://www.okx.com${swapPath}`, {
      headers: buildOKXHeaders('GET', swapPath),
    });

    const swapData = swapRes.data?.data?.[0];
    if (!swapData?.tx) throw new Error('No swap tx data returned from OKX DEX');

    const tx = swapData.tx;

    // 2. Broadcast via viem
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
   * Uses the borrowed vault liquidity to generate real DEX volume + profit.
   *
   * @param ausdAmount  Amount of AUSD borrowed from vault (in ether units string)
   * @returns SwapResult with net profit in AUSD
   */
  async executeRoundTrip(ausdAmount: string): Promise<SwapResult> {
    const MAX_PRICE_IMPACT = parseFloat(process.env.MAX_PRICE_IMPACT ?? '2.0');

    console.log(`[SwapExecutor] Starting round-trip: ${ausdAmount} AUSD → OKB → AUSD`);

    // ── Leg 1: AUSD → OKB ────────────────────────────────────────────────────
    console.log('[SwapExecutor] Leg 1: Getting AUSD → OKB quote...');
    const leg1Quote = await this.getQuote(AUSD_ADDRESS, OKB_ADDRESS, ausdAmount);
    const priceImpact1 = parseFloat(leg1Quote.priceImpact);

    console.log(`[SwapExecutor] Quote: ${ausdAmount} AUSD → ${leg1Quote.toAmount} OKB | Impact: ${priceImpact1.toFixed(3)}%`);

    if (priceImpact1 > MAX_PRICE_IMPACT) {
      throw new Error(`Price impact too high: ${priceImpact1.toFixed(2)}% > ${MAX_PRICE_IMPACT}%`);
    }

    console.log('[SwapExecutor] Executing Leg 1: AUSD → OKB...');
    const leg1Hash = await this.executeSwap(AUSD_ADDRESS, OKB_ADDRESS, ausdAmount);

    // ── Leg 2: OKB → AUSD ────────────────────────────────────────────────────
    // Use the actual OKB balance received
    const okbBalance = await this.client.readContract({
      address: OKB_ADDRESS as `0x${string}`,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const,
      functionName: 'balanceOf',
      args: [this.walletAddress],
    });

    // For native OKB, use eth_getBalance
    const nativeBalance = await this.client.getBalance({ address: this.walletAddress });
    // Use a conservative 90% of native balance to leave gas
    const okbToSwap = (nativeBalance * 90n) / 100n;
    const okbReadable = formatUnits(okbToSwap, 18);

    console.log(`[SwapExecutor] Leg 2: Getting OKB → AUSD quote for ${okbReadable} OKB...`);
    const leg2Quote = await this.getQuote(OKB_ADDRESS, AUSD_ADDRESS, okbReadable);
    const priceImpact2 = parseFloat(leg2Quote.priceImpact);

    console.log(`[SwapExecutor] Quote: ${okbReadable} OKB → ${leg2Quote.toAmount} AUSD | Impact: ${priceImpact2.toFixed(3)}%`);

    console.log('[SwapExecutor] Executing Leg 2: OKB → AUSD...');
    const leg2Hash = await this.executeSwap(OKB_ADDRESS, AUSD_ADDRESS, okbReadable);

    // ── Calculate profit ──────────────────────────────────────────────────────
    const ausdIn  = parseFloat(ausdAmount);
    const ausdOut = parseFloat(formatUnits(BigInt(leg2Quote.toAmount), 18));
    const profitUsd = ausdOut - ausdIn;

    console.log(`[SwapExecutor] Round-trip complete.`);
    console.log(`[SwapExecutor] In: ${ausdIn.toFixed(4)} AUSD | Out: ${ausdOut.toFixed(4)} AUSD | Profit: ${profitUsd.toFixed(4)} AUSD`);

    return {
      txHash:      leg2Hash,
      fromAmount:  ausdAmount,
      toAmount:    ausdOut.toFixed(6),
      priceImpact: Math.max(priceImpact1, priceImpact2).toFixed(3),
      profitUsd,
    };
  }
}
