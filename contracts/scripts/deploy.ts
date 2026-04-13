import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("--------------------------------------------------");
  console.log(`Deploying Aetherial Production Stack with: ${deployer.address}`);
  console.log("--------------------------------------------------");

  // 1. Deploy EAS Infrastructure (Trust Layer)
  console.log("[EAS] Deploying SchemaRegistry...");
  const SchemaRegistry = await ethers.getContractFactory("SchemaRegistry");
  const schemaRegistry = await SchemaRegistry.deploy();
  await schemaRegistry.waitForDeployment();
  const schemaRegistryAddress = await schemaRegistry.getAddress();
  console.log(`[EAS] SchemaRegistry: ${schemaRegistryAddress}`);

  console.log("[EAS] Deploying EAS Core...");
  const EAS = await ethers.getContractFactory("EAS");
  const eas = await EAS.deploy(schemaRegistryAddress);
  await eas.waitForDeployment();
  const easAddress = await eas.getAddress();
  console.log(`[EAS] EAS Core: ${easAddress}`);

  // 2. Register Agentic Alpha Schema
  // Schema: string agentName, uint256 alphaScore, uint256 timestamp
  const schema = "string agentName, uint256 alphaScore, uint256 timestamp";
  const resolverAddress = ethers.ZeroAddress; // No resolver for basic reputation
  const revocable = true;
  
  console.log("[EAS] Registering Agentic Alpha Schema...");
  const tx = await schemaRegistry.register(schema, resolverAddress, revocable);
  const receipt = await tx.wait();
  
  // EAS emits an event with the schema UID. For now we calculate it offline or fetch it.
  const schemaUID = ethers.keccak256(ethers.solidityPacked(["string", "address", "bool"], [schema, resolverAddress, revocable]));
  console.log(`[EAS] Schema UID: ${schemaUID}`);

  // 3. Deploy Aetherial Identity & Liquidity Layers
  console.log("[Aetherial] Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const registryAddress = await agentRegistry.getAddress();

  // 4. Deploy Mock Asset (For Testing/LP)
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const asset = await MockERC20.deploy("Aetherial USD", "AUSD", 18);
  await asset.waitForDeployment();
  const assetAddress = await asset.getAddress();

  console.log("[Aetherial] Deploying AetherialVault...");
  const AetherialVault = await ethers.getContractFactory("AetherialVault");
  const vault = await AetherialVault.deploy(registryAddress, assetAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  // 5. Export Deployments
  const deployments = {
    network: "xlayer_testnet",
    chainId: 1952,
    eas: {
      address: easAddress,
      schemaRegistry: schemaRegistryAddress,
      schemaUID: schemaUID
    },
    aetherial: {
      registry: registryAddress,
      vault: vaultAddress,
      asset: assetAddress
    }
  };

  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("--------------------------------------------------");
  console.log("PRODUCTION STACK ANCHORED SUCCESSFULLY");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
