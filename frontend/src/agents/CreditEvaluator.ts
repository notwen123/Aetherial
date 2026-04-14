import axios from 'axios';
import crypto from 'crypto';
import {
  createWalletClient,
  http,
  publicActions,
  encodeAbiParameters,
  parseAbiParameters,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { xLayerTestnet } from './chain';

// ── EAS ABI (attest function only) ──────────────────────────────────────────
const EAS_ABI = [
  {
    name: 'attest',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    outputs: [{ type: 'bytes32' }],
  },
] as const;

// ── OKX API auth header builder ──────────────────────────────────────────────
function buildOKXHeaders(method: string, path: string, body = '') {
  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}${method}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', process.env.OKX_SECRET_KEY ?? '')
    .update(prehash)
    .digest('base64');

  return {
    'OK-ACCESS-KEY': process.env.OKX_API_KEY ?? '',
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': process.env.OKX_API_PASSPHRASE ?? '',
    'OK-ACCESS-PROJECT': process.env.OKX_PROJECT_ID ?? '',
    'Content-Type': 'application/json',
  };
}

export interface AlphaMetrics {
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  winRate: number;
  buyTxCount: number;
  sellTxCount: number;
  totalVolumeUsd: number;
}

export class CreditEvaluator {
  private agentAddress: string;
  private client: ReturnType<typeof createWalletClient> & ReturnType<typeof publicActions>;

  constructor(agentAddress: string) {
    this.agentAddress = agentAddress;

    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY is missing');
    }

    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );
    this.client = createWalletClient({
      account,
      chain: xLayerTestnet,
      transport: http(process.env.XLAYER_TESTNET_RPC ?? 'https://testrpc.xlayer.tech/terigon'),
    }).extend(publicActions) as any;
  }

  /**
   * Fetches real on-chain PnL metrics from OKX DEX Market API.
   * Uses portfolio-overview for win rate + PnL, and dex-history for volume.
   */
  async fetchMetrics(): Promise<AlphaMetrics> {
    const basePath = '/api/v5/dex/market';

    // 1. Portfolio overview — win rate, realized/unrealized PnL
    const overviewPath = `${basePath}/portfolio-overview?address=${this.agentAddress}&chainIndex=196&timeFrame=7d`;
    const overviewRes = await axios.get(
      `https://www.okx.com${overviewPath}`,
      { headers: buildOKXHeaders('GET', overviewPath) }
    );

    const overview = overviewRes.data?.data ?? {};
    const realizedPnlUsd = parseFloat(overview.realizedPnlUsd ?? '0');
    const unrealizedPnlUsd = parseFloat(overview.unrealizedPnlUsd ?? '0');
    const winRate = parseFloat(overview.winRate ?? '0');
    const buyTxCount = parseInt(overview.buyTxCount ?? '0', 10);
    const sellTxCount = parseInt(overview.sellTxCount ?? '0', 10);

    // 2. DEX history — estimate total volume from last 20 trades
    const histPath = `${basePath}/portfolio-dex-history?address=${this.agentAddress}&chainIndex=196&limit=20`;
    const histRes = await axios.get(
      `https://www.okx.com${histPath}`,
      { headers: buildOKXHeaders('GET', histPath) }
    );

    const history: any[] = histRes.data?.data?.historyList ?? [];
    const totalVolumeUsd = history.reduce((sum: number, tx: any) => {
      return sum + parseFloat(tx.volumeUsd ?? tx.amount ?? '0');
    }, 0);

    return { realizedPnlUsd, unrealizedPnlUsd, winRate, buyTxCount, sellTxCount, totalVolumeUsd };
  }

  /**
   * Calculates the Agentic Alpha score (0-1000).
   *
   * Formula:  A_α = ( (Profit - Gas) / σ_risk ) × Reputation
   */
  async calculateAlpha(): Promise<{ score: number; metrics: AlphaMetrics }> {
    let metrics: AlphaMetrics;

    try {
      metrics = await this.fetchMetrics();
    } catch (err) {
      console.warn('[CreditEvaluator] OKX API unavailable — checking bootstrap config...');
      metrics = {
        realizedPnlUsd: 0,
        unrealizedPnlUsd: 0,
        winRate: 0,
        buyTxCount: 0,
        sellTxCount: 0,
        totalVolumeUsd: 0,
      };
    }

    const { realizedPnlUsd, winRate, buyTxCount, sellTxCount, totalVolumeUsd } = metrics;
    const txCount = buyTxCount + sellTxCount;

    // ── Bootstrap: new address with no on-chain history ───────────────────────
    if (txCount === 0 && totalVolumeUsd === 0) {
      const bootstrapScore = parseInt(process.env.BOOTSTRAP_SCORE ?? '0', 10);
      if (bootstrapScore > 0) {
        return { score: Math.min(bootstrapScore, 1000), metrics };
      }
      return { score: 0, metrics };
    }

    // ── Real alpha calculation ────────────────────────────────────────────────
    // Risk sigma: inverse of win rate (higher win rate = lower risk)
    const sigma = winRate > 0 ? 1 / winRate : 2.0;

    // Activity multiplier: log scale so 100 trades ≠ 10x better than 10 trades
    const activityMult = txCount > 0 ? Math.log10(txCount + 1) : 0;

    // Volume normaliser: $10k volume = 1.0, capped at 5x
    const volumeNorm = totalVolumeUsd > 0 ? Math.min(totalVolumeUsd / 10_000, 5.0) : 0;

    // Core alpha — scale to 0-1000
    const rawAlpha = (realizedPnlUsd / sigma) * activityMult * volumeNorm;
    const score = Math.min(Math.max(Math.round(rawAlpha), 0), 1000);

    console.log(`[CreditEvaluator] Metrics → PnL: $${realizedPnlUsd.toFixed(2)} | WinRate: ${(winRate * 100).toFixed(1)}% | Txs: ${txCount} | Volume: $${totalVolumeUsd.toFixed(2)}`);
    console.log(`[CreditEvaluator] Alpha Score: ${score}/1000`);

    return { score, metrics };
  }

  /**
   * Pushes a real EAS attestation on X Layer Testnet.
   * Schema: "string agentName, uint256 alphaScore, uint256 timestamp"
   */
  async attestPerformance(
    score: number,
    schemaUID: string,
    easAddress: string
  ): Promise<Hash> {
    console.log(`[EAS] Encoding attestation data for ${this.agentAddress}...`);

    // Properly ABI-encode the schema fields
    const encodedData = encodeAbiParameters(
      parseAbiParameters('string agentName, uint256 alphaScore, uint256 timestamp'),
      [
        this.agentAddress,
        BigInt(score),
        BigInt(Math.floor(Date.now() / 1000)),
      ]
    );

    console.log(`[EAS] Submitting attestation to ${easAddress}...`);

    const hash = await (this.client as any).writeContract({
      address: easAddress as `0x${string}`,
      abi: EAS_ABI,
      functionName: 'attest',
      args: [
        {
          schema: schemaUID as `0x${string}`,
          data: {
            recipient: this.agentAddress as `0x${string}`,
            expirationTime: BigInt(0),
            revocable: true,
            refUID: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
            data: encodedData,
            value: BigInt(0),
          },
        },
      ],
    });

    console.log(`[EAS] Attestation tx submitted: ${hash}`);

    // Wait for confirmation
    const receipt = await (this.client as any).waitForTransactionReceipt({ hash });
    console.log(`[EAS] Attestation confirmed in block ${receipt.blockNumber}`);

    return hash;
  }
}
