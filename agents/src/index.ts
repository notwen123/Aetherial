import { AgentOrchestrator } from "./orchestrator";

async function main() {
  const agentAddress = "0x2026AgentAddressPlaceholder";
  const orchestrator = new AgentOrchestrator(agentAddress);
  
  await orchestrator.runCycle();
}

main().catch((err) => {
  console.error("Critical failure in Aetherial Agent Loop:", err);
  process.exit(1);
});
