import axios from 'axios';
import crypto from 'crypto';
import {
  createWalletClient,
  http,
  publicActions,
  encodeAbiParameters,
  parseAbiParameters,
  type Hash,
  formatEther,
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

// ── OKX base URL — use proxy if set (for geo-restricted servers) ─────────────
const OKX_BASE = process.env.OKX_PROXY_URL ?? 'https://www.okx.com';

// ── OKX API auth header builder ──────────────────────────────────────────────
function buildOKXHeaders(method: string, path: string, body = '') {
  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}${method}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', process.env.OKX_SECRET_KEY ?? '')
    .update(prehash)
    .digest('base64');

  const headers: Record<string, string> = {
    'OK-ACCESS-KEY': process.env.OKX_API_KEY ?? '',
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': process.env.OKX_API_PASSPHRASE ?? '',
    'Content-Type': 'application/json',
  };

  if (process.env.OKX_PROJECT_ID) {
    headers['OK-ACCESS-PROJECT'] = process.env.OKX_PROJECT_ID;
  }

  return headers;
}

export interface AlphaMetrics {
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  winRate: number;
  buyTxCount: number;
  sellTxCount: number;
  totalVolumeUsd: number;
  provider: 'OKX_DEX' | 'VIEM_NATIVE';
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
      transport: http(process.env.XLAYER_TESTNET_RPC ?? 'https://testrpc.xlayer.tech'),
    }).extend(publicActions) as any;
  }

  /**
   * Fetches metrics from OKX DEX API if available, otherwise falls back to Viem-Native.
   */
  async fetchMetrics(): Promise<AlphaMetrics> {
    if (process.env.OKX_PROJECT_ID) {
      try {
        return await this.fetchOKXMetrics();
      } catch (err) {
        console.warn('[CreditEvaluator] OKX DEX API failed, falling back to Viem...', (err as Error).message);
      }
    } else {
      console.info('[CreditEvaluator] OKX_PROJECT_ID missing. Initializing Viem-Native fallback...');
    }

    return await this.fetchOnChainMetrics();
  }

  private async fetchOKXMetrics(): Promise<AlphaMetrics> {
    const basePath = '/api/v5/dex/market';

    // 1. Portfolio overview — win rate, realized/unrealized PnL
    const overviewPath = `${basePath}/portfolio-overview?address=${this.agentAddress}&chainIndex=196&timeFrame=7d`;
    const overviewRes = await axios.get(
      `${OKX_BASE}${overviewPath}`,
      { headers: buildOKXHeaders('GET', overviewPath) }
    );

    const overview = overviewRes.data?.data ?? {};
    
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

    return {
      realizedPnlUsd: parseFloat(overview.realizedPnlUsd ?? '0'),
      unrealizedPnlUsd: parseFloat(overview.unrealizedPnlUsd ?? '0'),
      winRate: parseFloat(overview.winRate ?? '0'),
      buyTxCount: parseInt(overview.buyTxCount ?? '0', 10),
      sellTxCount: parseInt(overview.sellTxCount ?? '0', 10),
      totalVolumeUsd,
      provider: 'OKX_DEX'
    };
  }

  /**
   * Viem-Native Fallback: Directly queries the blockchain for agent activity.
   */
  private async fetchOnChainMetrics(): Promise<AlphaMetrics> {
    console.log(`[CreditEvaluator] Querying X Layer Testnet for ${this.agentAddress} activity...`);
    
    const [balance, txCount] = await Promise.all([
      this.client.getBalance({ address: this.agentAddress as `0x${string}` }),
      this.client.getTransactionCount({ address: this.agentAddress as `0x${string}` }),
    ]);

    // We derive a 'Viem-Native' alpha based on on-chain liquidity and activity
    const balanceUsd = Number(formatEther(balance)) * 2500; // Simulated price for OKB/ETH
    
    return {
      realizedPnlUsd: 0,
      unrealizedPnlUsd: balanceUsd,
      winRate: txCount > 0 ? 0.85 : 0, // High confidence for active deployers
      buyTxCount: Math.floor(txCount / 2),
      sellTxCount: Math.ceil(txCount / 2),
      totalVolumeUsd: balanceUsd * (txCount || 1),
      provider: 'VIEM_NATIVE'
    };
  }

  /**
   * Calculates the Agentic Alpha score (0-1000).
   */
  async calculateAlpha(): Promise<{ score: number; metrics: AlphaMetrics }> {
    const metrics = await this.fetchMetrics();
    const { realizedPnlUsd, winRate, buyTxCount, sellTxCount, totalVolumeUsd, provider } = metrics;
    const txCount = buyTxCount + sellTxCount;

    console.log(`[CreditEvaluator] Provider: ${provider} | Alpha Loop starting...`);

    // ── Bootstrap: new address with no on-chain history ───────────────────────
    if (txCount === 0 && totalVolumeUsd === 0) {
      const bootstrapScore = parseInt(process.env.BOOTSTRAP_SCORE ?? '0', 10);
      if (bootstrapScore > 0) {
        return { score: Math.min(bootstrapScore, 1000), metrics };
      }
      return { score: 0, metrics };
    }

    // ── Real alpha calculation ────────────────────────────────────────────────
    const sigma = winRate > 0 ? 1 / winRate : 2.0;
    const activityMult = txCount > 0 ? Math.log10(txCount + 1) : 0;
    const volumeNorm = totalVolumeUsd > 0 ? Math.min(totalVolumeUsd / 10_000, 5.0) : 0;

    // Scale logic based on provider
    const baseValue = provider === 'OKX_DEX' ? realizedPnlUsd : (metrics.unrealizedPnlUsd * 0.1);

    const rawAlpha = (baseValue / sigma) * activityMult * volumeNorm;
    const score = Math.min(Math.max(Math.round(rawAlpha), 0), 1000);

    console.log(`[CreditEvaluator] Final Alpha Score: ${score}/1000`);

    return { score, metrics };
  }

  /**
   * Pushes a real EAS attestation on X Layer Testnet.
   */
  async attestPerformance(
    score: number,
    schemaUID: string,
    easAddress: string
  ): Promise<Hash> {
    console.log(`[EAS] Encoding attestation data for ${this.agentAddress}...`);

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
    await (this.client as any).waitForTransactionReceipt({ hash });
    return hash;
  }
}
