import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { formatEther } from 'viem';
import { CreditEvaluator } from './CreditEvaluator';
import { VaultClient } from './VaultClient';

function loadDeployments(): any {
  // Look for deployments.json relative to the contracts workspace
  const candidates = [
    path.resolve(__dirname, '../../contracts/deployments.json'),
    path.resolve(__dirname, '../deployments.json'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log(`[Orchestrator] Loaded deployments from ${p}`);
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }

  console.error('[Orchestrator] deployments.json not found.');
  console.error('  → Run: cd contracts && npx hardhat run scripts/deploy.ts --network xlayer_testnet');
  process.exit(1);
}

export class AgentOrchestrator {
  private deployments: any;
  private vaultClient: VaultClient;
  private evaluator: CreditEvaluator;
  private agentAddress: string;

  constructor() {
    this.deployments = loadDeployments();
    this.vaultClient = new VaultClient(this.deployments);
    this.agentAddress = this.vaultClient.getAgentAddress();
    this.evaluator = new CreditEvaluator(this.agentAddress);
  }

  /**
   * Full autonomous prime broker cycle:
   *
   *  1. REGISTER   — ensure agent is on-chain in AgentRegistry
   *  2. AUDIT      — fetch real OKX DEX metrics, compute alpha score
   *  3. ATTEST     — push EAS attestation on X Layer Testnet
   *  4. SCORE      — write credit score + EAS UID to AgentRegistry (triggers auto-whitelist)
   *  5. EXECUTE    — if whitelisted, request vault liquidity
   *  6. SETTLE     — return principal (+ simulated profit) to vault
   */
  async runCycle(): Promise<void> {
    console.log('\n══════════════════════════════════════════════════');
    console.log(`  Aetherial Agent Cycle — ${new Date().toISOString()}`);
    console.log(`  Agent: ${this.agentAddress}`);
    console.log('══════════════════════════════════════════════════\n');

    // ── 1. REGISTER ──────────────────────────────────────────────────────────
    console.log('[1/5] Checking agent registration...');
    await this.vaultClient.ensureRegistered();

    // ── 2. AUDIT ─────────────────────────────────────────────────────────────
    console.log('\n[2/5] Fetching real-time performance metrics via OKX DEX API...');
    const { score, metrics } = await this.evaluator.calculateAlpha();

    // ── 3. ATTEST ─────────────────────────────────────────────────────────────
    console.log('\n[3/5] Anchoring reputation to EAS on X Layer Testnet...');
    let easUID = '0x0000000000000000000000000000000000000000000000000000000000000000';
    try {
      const attestHash = await this.evaluator.attestPerformance(
        score,
        this.deployments.eas.schemaUID,
        this.deployments.eas.address
      );
      easUID = attestHash; // Use tx hash as UID reference until EAS event parsing
      console.log(`[3/5] EAS attestation anchored: ${easUID}`);
    } catch (err) {
      console.warn(`[3/5] EAS attestation failed (non-fatal): ${(err as Error).message}`);
      console.warn('      Continuing with score update...');
    }

    // ── 4. SCORE ──────────────────────────────────────────────────────────────
    console.log('\n[4/5] Writing credit score to AgentRegistry...');
    await this.vaultClient.updateCreditScore(score, easUID);

    const minScore = parseInt(process.env.MIN_CREDIT_SCORE ?? '500', 10);

    if (score < minScore) {
      console.log(`\n[5/5] Score ${score} < threshold ${minScore}. Liquidity denied — protecting LP principal.`);
      console.log('\n══════════════════════════════════════════════════');
      console.log('  Cycle complete. Status: AUDITED — BELOW THRESHOLD');
      console.log('══════════════════════════════════════════════════\n');
      return;
    }

    // ── 5. EXECUTE ────────────────────────────────────────────────────────────
    console.log(`\n[5/5] Score ${score} ≥ ${minScore}. Requesting vault liquidity...`);

    const state = await this.vaultClient.getVaultState();
    console.log(`      Vault total assets : ${formatEther(state.totalAssets)} AUSD`);
    console.log(`      Vault available    : ${formatEther(state.totalAssets - state.totalAllocated)} AUSD`);
    console.log(`      Agent allocation   : ${formatEther(state.agentAllocation)} AUSD`);

    // Skip if agent already has an open allocation
    if (state.agentAllocation > 0n) {
      console.log('      Agent already has an active allocation. Settling previous position first...');
      await this._settlePosition(state.agentAllocation);
    }

    const maxRequest = process.env.MAX_LIQUIDITY_REQUEST ?? '1000';
    const requestHash = await this.vaultClient.requestLiquidity(maxRequest);
    console.log(`      Liquidity allocated. Tx: ${requestHash}`);

    // ── 6. SETTLE (same cycle — return principal immediately for demo) ────────
    // In a real strategy the agent would hold the liquidity, execute trades,
    // then call settle in a future cycle. Here we settle immediately to
    // demonstrate the full round-trip on testnet.
    const newState = await this.vaultClient.getVaultState();
    if (newState.agentAllocation > 0n) {
      console.log('\n      Settling position back to vault (round-trip demo)...');
      await this._settlePosition(newState.agentAllocation);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Cycle complete. Status: NOMINAL');
    console.log('══════════════════════════════════════════════════\n');
  }

  private async _settlePosition(allocation: bigint): Promise<void> {
    // Return exactly the principal (no profit on testnet demo)
    const repayment = formatEther(allocation);
    await this.vaultClient.settleLiquidity(repayment);
  }
}
