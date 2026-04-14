import {
  createWalletClient,
  http,
  publicActions,
  parseEther,
  formatEther,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { xLayerTestnet } from './chain';

// ── Minimal ABIs ─────────────────────────────────────────────────────────────

const REGISTRY_ABI = [
  {
    name: 'registerAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'isRegistered', type: 'bool' },
          { name: 'creditScore', type: 'uint256' },
          { name: 'easAttestationUID', type: 'string' },
          { name: 'isWhitelisted', type: 'bool' },
          { name: 'lastUpdated', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'updateCreditScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'score', type: 'uint256' },
      { name: 'easUID', type: 'string' },
    ],
    outputs: [],
  },
] as const;

const VAULT_ABI = [
  {
    name: 'requestLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'settleLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'repaymentAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'activeAllocations',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalAllocated',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export interface VaultState {
  totalAssets: bigint;
  totalAllocated: bigint;
  agentAllocation: bigint;
  agentAusdBalance: bigint;
}

export class VaultClient {
  private client: any;
  private agentAddress: `0x${string}`;
  private registryAddress: `0x${string}`;
  private vaultAddress: `0x${string}`;
  private ausdAddress: `0x${string}`;

  constructor(deployments: any) {
    if (!process.env.PRIVATE_KEY) {
       throw new Error('PRIVATE_KEY is missing');
    }
    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );
    this.agentAddress = account.address;

    this.registryAddress = deployments.aetherial.registry as `0x${string}`;
    this.vaultAddress = deployments.aetherial.vault as `0x${string}`;
    this.ausdAddress = deployments.aetherial.ausd as `0x${string}`;

    this.client = createWalletClient({
      account,
      chain: xLayerTestnet,
      transport: http(process.env.XLAYER_TESTNET_RPC ?? 'https://testrpc.xlayer.tech/terigon'),
    }).extend(publicActions);
  }

  /** Ensure this agent is registered in AgentRegistry. */
  async ensureRegistered(): Promise<void> {
    const agentData = await this.client.readContract({
      address: this.registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'getAgent',
      args: [this.agentAddress],
    });

    if (!agentData.isRegistered) {
      console.log('[VaultClient] Agent not registered. Registering now...');
      const hash: Hash = await this.client.writeContract({
        address: this.registryAddress,
        abi: REGISTRY_ABI,
        functionName: 'registerAgent',
        args: [],
      });
      await this.client.waitForTransactionReceipt({ hash });
      console.log(`[VaultClient] Agent registered. Tx: ${hash}`);
    } else {
      console.log(`[VaultClient] Agent already registered. Score: ${agentData.creditScore}/1000 | Whitelisted: ${agentData.isWhitelisted}`);
    }
  }

  /** Push the new credit score + EAS UID on-chain via AgentRegistry. */
  async updateCreditScore(score: number, easUID: string): Promise<void> {
    console.log(`[VaultClient] Updating on-chain credit score to ${score}/1000...`);
    const hash: Hash = await this.client.writeContract({
      address: this.registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'updateCreditScore',
      args: [this.agentAddress, BigInt(score), easUID],
    });
    await this.client.waitForTransactionReceipt({ hash });
    console.log(`[VaultClient] Credit score updated on-chain. Tx: ${hash}`);
  }

  /** Read current vault + agent state. */
  async getVaultState(): Promise<VaultState> {
    const [totalAssets, totalAllocated, agentAllocation, agentAusdBalance] =
      await Promise.all([
        this.client.readContract({
          address: this.vaultAddress,
          abi: VAULT_ABI,
          functionName: 'totalAssets',
          args: [],
        }),
        this.client.readContract({
          address: this.vaultAddress,
          abi: VAULT_ABI,
          functionName: 'totalAllocated',
          args: [],
        }),
        this.client.readContract({
          address: this.vaultAddress,
          abi: VAULT_ABI,
          functionName: 'activeAllocations',
          args: [this.agentAddress],
        }),
        this.client.readContract({
          address: this.ausdAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [this.agentAddress],
        }),
      ]);

    return { totalAssets, totalAllocated, agentAllocation, agentAusdBalance };
  }

  /**
   * Request liquidity from the vault.
   * Amount is capped at MAX_LIQUIDITY_REQUEST env var and 20% of vault assets.
   */
  async requestLiquidity(requestAmountEther: string): Promise<Hash> {
    const state = await this.getVaultState();
    const available = state.totalAssets - state.totalAllocated;
    const maxAlloc = (state.totalAssets * 2000n) / 10000n; // 20% cap from contract

    const requested = parseEther(requestAmountEther);
    const capped = requested < available && requested < maxAlloc
      ? requested
      : available < maxAlloc ? available : maxAlloc;

    if (capped === 0n) {
      throw new Error('No liquidity available in vault');
    }

    console.log(`[VaultClient] Requesting ${formatEther(capped)} AUSD from vault...`);
    const hash: Hash = await this.client.writeContract({
      address: this.vaultAddress,
      abi: VAULT_ABI,
      functionName: 'requestLiquidity',
      args: [capped],
    });
    await this.client.waitForTransactionReceipt({ hash });
    console.log(`[VaultClient] Liquidity received. Tx: ${hash}`);
    return hash;
  }

  /**
   * Settle liquidity back to the vault.
   * Approves AUSD spend then calls settleLiquidity.
   */
  async settleLiquidity(repaymentAmountEther: string): Promise<Hash> {
    const repayment = parseEther(repaymentAmountEther);

    // Approve vault to pull repayment
    console.log(`[VaultClient] Approving ${repaymentAmountEther} AUSD for vault settlement...`);
    const approveHash: Hash = await this.client.writeContract({
      address: this.ausdAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [this.vaultAddress, repayment],
    });
    await this.client.waitForTransactionReceipt({ hash: approveHash });

    console.log(`[VaultClient] Settling ${repaymentAmountEther} AUSD back to vault...`);
    const hash: Hash = await this.client.writeContract({
      address: this.vaultAddress,
      abi: VAULT_ABI,
      functionName: 'settleLiquidity',
      args: [repayment],
    });
    await this.client.waitForTransactionReceipt({ hash });
    console.log(`[VaultClient] Settlement complete. Tx: ${hash}`);
    return hash;
  }

  getAgentAddress(): `0x${string}` {
    return this.agentAddress;
  }
}
