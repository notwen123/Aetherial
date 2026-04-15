import dotenv from 'dotenv';
import path from 'path';
import { AgentOrchestrator } from './orchestrator';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const orchestrator = new AgentOrchestrator();
  const intervalS = parseInt(process.env.AGENT_INTERVAL_SECONDS ?? '300', 10);

  console.log("══════════════════════════════════════════════════");
  console.log("  Aetherial Agent — Autonomous Prime Broker Loop");
  console.log("══════════════════════════════════════════════════");
  console.log(`  Interval : ${intervalS}s`);
  console.log(`  Network  : OKX X Layer Testnet`);
  console.log("══════════════════════════════════════════════════\n");

  while (true) {
    try {
      console.log(`\n[${new Date().toISOString()}] Initializing Cycle...`);
      const result = await orchestrator.runCycle();
      console.log(`[${new Date().toISOString()}] Cycle Result: ${result.status}`);
    } catch (err) {
      console.error(`\n[${new Date().toISOString()}] FATAL CYCLE ERROR:`, (err as Error).message);
    }

    console.log(`\n[Wait] Sleeping for ${intervalS}s...`);
    await new Promise(resolve => setTimeout(resolve, intervalS * 1000));
  }
}

main().catch(err => {
  console.error("FATAL RUNNER ERROR:", err);
  process.exit(1);
});
