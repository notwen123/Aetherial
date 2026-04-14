import { formatEther } from 'viem';
import { CreditEvaluator } from './CreditEvaluator';
import { VaultClient } from './VaultClient';
import deployments from '@/deployments.json';

export class AgentOrchestrator {
  private vaultClient: VaultClient;
  private evaluator: CreditEvaluator;
  private agentAddress: string;

  constructor() {
    this.vaultClient = new VaultClient(deployments);
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
  async runCycle(): Promise<{ status: string; score: number; easUID: string; logs: string[] }> {
    const logs: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
    };

    log(`[Orchestrator] Starting cycle for agent: ${this.agentAddress}`);

    try {
      // ── 1. REGISTER ──────────────────────────────────────────────────────────
      log('[1/5] Checking agent registration...');
      await this.vaultClient.ensureRegistered();

      // ── 2. AUDIT ─────────────────────────────────────────────────────────────
      log('[2/5] Fetching real-time performance metrics via OKX DEX API...');
      const { score } = await this.evaluator.calculateAlpha();
      log(`[2/5] Alpha score computed: ${score}/1000`);

      // ── 3. ATTEST ─────────────────────────────────────────────────────────────
      log('[3/5] Anchoring reputation to EAS on X Layer Testnet...');
      let easUID = '0x0000000000000000000000000000000000000000000000000000000000000000';
      try {
        const attestHash = await this.evaluator.attestPerformance(
          score,
          deployments.eas.schemaUID,
          deployments.eas.address
        );
        easUID = attestHash;
        log(`[3/5] EAS attestation anchored: ${easUID}`);
      } catch (err) {
        log(`[3/5] EAS attestation failed (non-fatal): ${(err as Error).message}`);
      }

      // ── 4. SCORE ──────────────────────────────────────────────────────────────
      log('[4/5] Writing credit score to AgentRegistry...');
      await this.vaultClient.updateCreditScore(score, easUID);

      const minScore = parseInt(process.env.MIN_CREDIT_SCORE ?? '500', 10);

      if (score < minScore) {
        log(`[5/5] Score ${score} < threshold ${minScore}. Liquidity denied.`);
        return { status: 'INSUFFICIENT_ALPHA', score, easUID, logs };
      }

      // ── 5. EXECUTE ────────────────────────────────────────────────────────────
      log(`[5/5] Score ${score} ≥ ${minScore}. Requesting vault liquidity...`);

      const state = await this.vaultClient.getVaultState();
      
      // Skip if agent already has an open allocation
      if (state.agentAllocation > 0n) {
        log('      Agent already has an active allocation. Settling previous position first...');
        await this._settlePosition(state.agentAllocation);
      }

      const maxRequest = process.env.MAX_LIQUIDITY_REQUEST ?? '1000';
      const requestHash = await this.vaultClient.requestLiquidity(maxRequest);
      log(`      Liquidity allocated. Tx: ${requestHash}`);

      // ── 6. SETTLE (same cycle — round-trip demo) ─────────────────────────────
      const newState = await this.vaultClient.getVaultState();
      if (newState.agentAllocation > 0n) {
        log('      Settling position back to vault (round-trip demo)...');
        await this._settlePosition(newState.agentAllocation);
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
    await this.vaultClient.settleLiquidity(repayment);
  }
}
