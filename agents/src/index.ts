import 'dotenv/config';
import { AgentOrchestrator } from './orchestrator';

const REQUIRED_ENV = ['PRIVATE_KEY', 'OKX_API_KEY', 'OKX_SECRET_KEY', 'OKX_API_PASSPHRASE'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('[Aetherial] Missing required environment variables:');
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error('\n  Copy agents/.env.example to agents/.env and fill in your values.');
  process.exit(1);
}

const CYCLE_INTERVAL_MS = parseInt(process.env.CYCLE_INTERVAL_MS ?? '60000', 10);

async function main() {
  console.log('Aetherial Agentic Prime Broker — X Layer Testnet');
  console.log(`Cycle interval: ${CYCLE_INTERVAL_MS / 1000}s\n`);

  const orchestrator = new AgentOrchestrator();

  // Run first cycle immediately, then loop
  await orchestrator.runCycle();

  setInterval(async () => {
    try {
      await orchestrator.runCycle();
    } catch (err) {
      console.error('[Aetherial] Cycle error (will retry):', (err as Error).message);
    }
  }, CYCLE_INTERVAL_MS);
}

main().catch((err) => {
  console.error('[Aetherial] Fatal startup error:', err);
  process.exit(1);
});
