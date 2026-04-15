import { formatEther } from 'viem';
import { CreditEvaluator } from './CreditEvaluator';
import { VaultClient } from './VaultClient';
import { SwapExecutor } from './SwapExecutor';
import deployments from '@/deployments.json';

export class AgentOrchestrator {
  private vaultClient: VaultClient;
  private evaluator: CreditEvaluator;
  private swapper: SwapExecutor;
  private agentAddress: string;

  constructor() {
    this.vaultClient = new VaultClient(deployments);
    this.agentAddress = this.vaultClient.getAgentAddress();
    this.evaluator = new CreditEvaluator(this.agentAddress);
    this.swapper = new SwapExecutor();
  }

  /**
   * Persistent autonomous broker loop.
   */
  async start(intervalMs = 600000): Promise<void> {
    console.log(`[Orchestrator] Starting persistent loop (Interval: ${intervalMs / 1000}s)`);
    
    while (true) {
      try {
        await this.runCycle();
      } catch (err) {
        console.error(`[Orchestrator] Cycle failed but loop continuing: ${(err as Error).message}`);
      }
      
      console.log(`[Orchestrator] Sleeping for ${intervalMs / 1000}s...`);
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  /**
   * Full autonomous prime broker cycle:
   * 
   *  1. REGISTER   — ensure agent is on-chain in AgentRegistry
   *  2. AUDIT      — fetch real OKX/Viem metrics, compute alpha score
   *  3. ATTEST     — push EAS attestation on X Layer Testnet
   *  4. SCORE      — write credit score + EAS UID to AgentRegistry (triggers auto-whitelist)
   *  5. EXECUTE    — if whitelisted, request vault liquidity and perform swaps
   *  6. SETTLE     — return principal (+ profit) to vault
   */
  async runCycle(): Promise<{ status: string; score: number; easUID: string; logs: string[] }> {
    const logs: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
    };

    log(`\n══════════════════════════════════════════════════`);
    log(`[Orchestrator] Cycle Start: ${new Date().toISOString()}`);
    log(`[Orchestrator] Agent: ${this.agentAddress}`);

    try {
      // ── 1. REGISTER ──────────────────────────────────────────────────────────
      log('[1/5] Checking Agent Registry status...');
      await this.vaultClient.ensureRegistered();

      // ── 2. AUDIT ─────────────────────────────────────────────────────────────
      log('[2/5] Fetching production OKX alpha metrics...');
      const { score, metrics } = await this.evaluator.calculateAlpha();
      log(`[2/5] Alpha score computed: ${score}/1000 via ${metrics.provider}`);

      // ── 3. ATTEST ─────────────────────────────────────────────────────────────
      log('[3/5] Anchoring reputation to EAS on X Layer...');
      let easUID = '0x0000000000000000000000000000000000000000000000000000000000000000';
      try {
        easUID = await this.evaluator.attestPerformance(
          score,
          deployments.eas.schemaUID,
          deployments.eas.address
        );
        log(`[3/5] EAS attestation anchored: ${easUID}`);
      } catch (err) {
        log(`[3/5] EAS attestation skipped: ${(err as Error).message}`);
      }

      // ── 4. SCORE ──────────────────────────────────────────────────────────────
      log('[4/5] Writing credit score to AgentRegistry...');
      await this.vaultClient.updateCreditScore(score, easUID);

      const minScore = parseInt(process.env.MIN_CREDIT_SCORE ?? '500', 10);

      if (score < minScore) {
        log(`[5/5] Score ${score} < threshold ${minScore}. Access denied.`);
        return { status: 'INSUFFICIENT_ALPHA', score, easUID, logs };
      }

      // ── 5. EXECUTE ────────────────────────────────────────────────────────────
      log(`[5/5] Access Granted. Syncing with Vault...`);

      const state = await this.vaultClient.getVaultState();
      
      if (state.agentAllocation > 0n) {
        log('      Clearing active previous cycle position...');
        await this._settlePosition(state.agentAllocation);
      }

      const requestAmount = process.env.MAX_LIQUIDITY_REQUEST ?? '1000';
      log(`      Requesting liquidity: $${requestAmount} AUSD`);
      await this.vaultClient.requestLiquidity(requestAmount);

      // ── 6. TRADE ─────────────────────────────────────────────────────────────
      log('      [Broker] Initiating Security Scan & Real DEX Swap...');
      try {
        const swapResult = await this.swapper.executeRoundTrip(requestAmount);
        log(`      [Broker] Cycle Success | Profit: $${swapResult.profitUsd.toFixed(4)}`);
        log(`      [Broker] Final TX: ${swapResult.txHash}`);
      } catch (err) {
        log(`      [Broker] Trade cycle error: ${(err as Error).message}`);
      }

      // ── 7. SETTLE ────────────────────────────────────────────────────────────
      const finalState = await this.vaultClient.getVaultState();
      if (finalState.agentAllocation > 0n) {
        log('      Settling performance markers back to vault...');
        await this._settlePosition(finalState.agentAllocation);
      }

      log('[Orchestrator] Cycle complete. Status: NOMINAL');
      return { status: 'NOMINAL', score, easUID, logs };

    } catch (err) {
      log(`[Orchestrator] Fatal cycle error: ${(err as Error).message}`);
      throw err;
    }
  }

  private async _settlePosition(allocation: bigint): Promise<void> {
    const repayment = formatEther(allocation);
    // Vault will handle pro-rated loss points via its internal slasher
    await this.vaultClient.settleLiquidity(repayment);
  }
}
