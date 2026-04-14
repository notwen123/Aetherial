import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("══════════════════════════════════════════════════");
  console.log("  Aetherial Protocol — X Layer Testnet Deployment");
  console.log("══════════════════════════════════════════════════");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} OKB`);
  console.log("══════════════════════════════════════════════════\n");

  // ── 1. EAS Infrastructure ─────────────────────────────────────────────────
  console.log("[1/6] Deploying EAS SchemaRegistry...");
  const SchemaRegistry = await ethers.getContractFactory("SchemaRegistry");
  const schemaRegistry = await SchemaRegistry.deploy();
  await schemaRegistry.waitForDeployment();
  const schemaRegistryAddress = await schemaRegistry.getAddress();
  console.log(`      SchemaRegistry → ${schemaRegistryAddress}`);

  console.log("[2/6] Deploying EAS Core...");
  const EAS = await ethers.getContractFactory("EAS");
  const eas = await EAS.deploy(schemaRegistryAddress);
  await eas.waitForDeployment();
  const easAddress = await eas.getAddress();
  console.log(`      EAS Core       → ${easAddress}`);

  // Register the Agentic Alpha schema and extract UID from the emitted event
  const schema = "string agentName, uint256 alphaScore, uint256 timestamp";
  const resolverAddress = ethers.ZeroAddress;
  const revocable = true;

  console.log("[2/6] Registering Agentic Alpha Schema...");
  const schemaTx = await schemaRegistry.register(schema, resolverAddress, revocable);
  const schemaReceipt = await schemaTx.wait();

  // Parse the Registered event to get the real UID
  let schemaUID = "";
  if (schemaReceipt && schemaReceipt.logs) {
    for (const log of schemaReceipt.logs) {
      try {
        const parsed = schemaRegistry.interface.parseLog(log);
        if (parsed && parsed.name === "Registered") {
          schemaUID = parsed.args.uid;
          break;
        }
      } catch (_) {}
    }
  }
  // Fallback: derive deterministically (matches EAS SchemaRegistry logic)
  if (!schemaUID) {
    schemaUID = ethers.keccak256(
      ethers.solidityPacked(["string", "address", "bool"], [schema, resolverAddress, revocable])
    );
  }
  console.log(`      Schema UID     → ${schemaUID}`);

  // ── 2. Reputation NFT ─────────────────────────────────────────────────────
  console.log("[3/6] Deploying ReputationNFT...");
  const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log(`      ReputationNFT  → ${reputationNFTAddress}`);

  // ── 3. Agent Registry ─────────────────────────────────────────────────────
  console.log("[4/6] Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy(reputationNFTAddress);
  await agentRegistry.waitForDeployment();
  const registryAddress = await agentRegistry.getAddress();
  console.log(`      AgentRegistry  → ${registryAddress}`);

  // Transfer ReputationNFT ownership to AgentRegistry so it can mint
  console.log("      Transferring ReputationNFT ownership → AgentRegistry...");
  await (await reputationNFT.transferOwnership(registryAddress)).wait();

  // ── 4. AUSD Token ─────────────────────────────────────────────────────────
  console.log("[5/6] Deploying AetherialToken (AUSD)...");
  const AetherialToken = await ethers.getContractFactory("AetherialToken");
  const ausd = await AetherialToken.deploy("Aetherial USD", "AUSD", 18);
  await ausd.waitForDeployment();
  const ausdAddress = await ausd.getAddress();
  console.log(`      AUSD Token     → ${ausdAddress}`);

  // Mint initial testnet supply to deployer (acts as faucet)
  const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M AUSD
  await (await ausd.mint(deployer.address, INITIAL_SUPPLY)).wait();
  console.log(`      Minted 10,000,000 AUSD to deployer`);

  // ── 5. Vault ──────────────────────────────────────────────────────────────
  console.log("[6/6] Deploying AetherialVault...");
  const AetherialVault = await ethers.getContractFactory("AetherialVault");
  const vault = await AetherialVault.deploy(registryAddress, ausdAddress, deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`      AetherialVault → ${vaultAddress}`);

  // ── 6. Write deployments.json ─────────────────────────────────────────────
  const deployments = {
    network: "xlayer_testnet",
    chainId: 1952,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    eas: {
      address: easAddress,
      schemaRegistry: schemaRegistryAddress,
      schemaUID,
    },
    aetherial: {
      reputationNFT: reputationNFTAddress,
      registry: registryAddress,
      vault: vaultAddress,
      ausd: ausdAddress,
    },
  };

  const outPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));

  // Also write a copy to the frontend for easy import
  const frontendOut = path.join(__dirname, "..", "..", "frontend", "src", "deployments.json");
  fs.writeFileSync(frontendOut, JSON.stringify(deployments, null, 2));

  console.log("\n══════════════════════════════════════════════════");
  console.log("  PRODUCTION STACK DEPLOYED SUCCESSFULLY");
  console.log(`  deployments.json written to contracts/ and frontend/src/`);
  console.log("══════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
