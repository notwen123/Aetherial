import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AetherialVault, AgentRegistry, AetherialToken, ReputationNFT } from "../typechain-types/contracts/contracts";
import { EAS, SchemaRegistry } from "../typechain-types/contracts/contracts/eas";

describe("Aetherial Protocol", function () {
  let vault: AetherialVault;
  let registry: AgentRegistry;
  let nft: ReputationNFT;
  let asset: AetherialToken;
  let owner: SignerWithAddress;
  let lp: SignerWithAddress;
  let agent: SignerWithAddress;
  let treasury: SignerWithAddress;

  beforeEach(async function () {
    [owner, lp, agent, treasury] = await ethers.getSigners();

    // 1. Deploy AUSD token (replaces MockERC20)
    const AetherialToken = await ethers.getContractFactory("AetherialToken");
    asset = await AetherialToken.deploy("Aetherial USD", "AUSD", 18);
    await asset.waitForDeployment();

    // 2. Deploy ReputationNFT
    const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
    nft = await ReputationNFT.deploy();
    await nft.waitForDeployment();

    // 3. Deploy AgentRegistry (requires ReputationNFT address)
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy(await nft.getAddress());
    await registry.waitForDeployment();

    // Transfer ReputationNFT ownership to AgentRegistry so it can mint
    await nft.transferOwnership(await registry.getAddress());

    // 4. Deploy AetherialVault (requires registry, asset, treasury)
    const AetherialVault = await ethers.getContractFactory("AetherialVault");
    vault = await AetherialVault.deploy(
      await registry.getAddress(),
      await asset.getAddress(),
      treasury.address
    );
    await vault.waitForDeployment();

    // Mint AUSD to LP and approve vault
    await asset.mint(lp.address, ethers.parseEther("1000"));
    await asset.connect(lp).approve(await vault.getAddress(), ethers.parseEther("1000"));
  });

  // ── LP deposit / withdraw ──────────────────────────────────────────────────

  it("Should allow LP to deposit and receive shares", async function () {
    await vault.connect(lp).deposit(ethers.parseEther("100"));
    // First deposit: shares == amount (1:1 ratio)
    expect(await vault.lpShares(lp.address)).to.equal(ethers.parseEther("100"));
    expect(await vault.totalShares()).to.equal(ethers.parseEther("100"));
  });

  it("Should allow LP to withdraw by burning shares", async function () {
    await vault.connect(lp).deposit(ethers.parseEther("100"));
    const shares = await vault.lpShares(lp.address);

    // Withdraw half the shares
    const halfShares = shares / 2n;
    await vault.connect(lp).withdraw(halfShares);

    expect(await vault.lpShares(lp.address)).to.equal(halfShares);
  });

  it("Should revert withdraw if shares exceed balance", async function () {
    await vault.connect(lp).deposit(ethers.parseEther("100"));
    const tooMany = ethers.parseEther("200");
    await expect(vault.connect(lp).withdraw(tooMany))
      .to.be.revertedWith("Insufficient shares");
  });

  // ── Agent whitelist / liquidity ───────────────────────────────────────────

  it("Should allow manually whitelisted agent to borrow liquidity", async function () {
    // Register and manually whitelist (bypasses score threshold for test)
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);

    // LP deposits
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    // Agent borrows
    await expect(vault.connect(agent).requestLiquidity(ethers.parseEther("100")))
      .to.emit(vault, "LiquidityAllocated")
      .withArgs(agent.address, ethers.parseEther("100"));

    expect(await asset.balanceOf(agent.address)).to.equal(ethers.parseEther("100"));
    expect(await vault.activeAllocations(agent.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should prevent non-whitelisted agent from borrowing", async function () {
    await registry.connect(agent).registerAgent();
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    await expect(vault.connect(agent).requestLiquidity(ethers.parseEther("100")))
      .to.be.revertedWith("Agent not whitelisted");
  });

  it("Should auto-whitelist agent when credit score reaches threshold", async function () {
    await registry.connect(agent).registerAgent();

    // Score below threshold — not whitelisted
    await registry.connect(owner).updateCreditScore(agent.address, 499, "0xabc");
    expect((await registry.getAgent(agent.address)).isWhitelisted).to.equal(false);

    // Score at threshold — auto-whitelisted
    await registry.connect(owner).updateCreditScore(agent.address, 500, "0xdef");
    expect((await registry.getAgent(agent.address)).isWhitelisted).to.equal(true);
  });

  it("Should mint ReputationNFT on first credit score update", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).updateCreditScore(agent.address, 600, "0xeas123");

    const tokenId = await nft.agentTokenId(agent.address);
    expect(tokenId).to.be.gt(0n);
    expect(await nft.ownerOf(tokenId)).to.equal(agent.address);
    expect(await nft.tokenURI(tokenId)).to.equal("0xeas123");
  });

  it("Should block ReputationNFT transfer (soulbound)", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).updateCreditScore(agent.address, 600, "0xeas456");

    const tokenId = await nft.agentTokenId(agent.address);
    await expect(
      nft.connect(agent).transferFrom(agent.address, lp.address, tokenId)
    ).to.be.revertedWith("Reputation NFT is soulbound");
  });

  // ── Settlement & yield distribution ──────────────────────────────────────

  it("Should settle trade at principal (no profit)", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    await vault.connect(agent).requestLiquidity(ethers.parseEther("100"));

    // Approve repayment
    await asset.connect(agent).approve(await vault.getAddress(), ethers.parseEther("100"));

    await expect(vault.connect(agent).settleLiquidity(ethers.parseEther("100")))
      .to.emit(vault, "LiquiditySettled")
      .withArgs(agent.address, ethers.parseEther("100"), 0n);

    expect(await vault.activeAllocations(agent.address)).to.equal(0n);
  });

  it("Should distribute LP yield on profitable settlement", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    await vault.connect(agent).requestLiquidity(ethers.parseEther("100"));

    // Agent earns 10 AUSD profit, returns 110
    await asset.mint(agent.address, ethers.parseEther("10"));
    await asset.connect(agent).approve(await vault.getAddress(), ethers.parseEther("110"));

    await vault.connect(agent).settleLiquidity(ethers.parseEther("110"));

    // profit = 10 AUSD
    // protocol fee = 5% of 10 = 0.5 AUSD
    // agent fee    = 10% of 10 = 1.0 AUSD
    // LP profit    = 85% of 10 = 8.5 AUSD
    const lpYield = await vault.pendingYieldOf(lp.address);
    expect(lpYield).to.equal(ethers.parseEther("8.5"));

    // Protocol fee accrued
    expect(await vault.protocolFeeAccrued()).to.equal(ethers.parseEther("0.5"));
  });

  it("Should allow LP to claim yield", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);
    await vault.connect(lp).deposit(ethers.parseEther("500"));
    await vault.connect(agent).requestLiquidity(ethers.parseEther("100"));

    await asset.mint(agent.address, ethers.parseEther("10"));
    await asset.connect(agent).approve(await vault.getAddress(), ethers.parseEther("110"));
    await vault.connect(agent).settleLiquidity(ethers.parseEther("110"));

    const balanceBefore = await asset.balanceOf(lp.address);
    await vault.connect(lp).claimYield();
    const balanceAfter = await asset.balanceOf(lp.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("8.5"));
    expect(await vault.pendingYieldOf(lp.address)).to.equal(0n);
  });

  it("Should allow owner to withdraw protocol fees to treasury", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);
    await vault.connect(lp).deposit(ethers.parseEther("500"));
    await vault.connect(agent).requestLiquidity(ethers.parseEther("100"));

    await asset.mint(agent.address, ethers.parseEther("10"));
    await asset.connect(agent).approve(await vault.getAddress(), ethers.parseEther("110"));
    await vault.connect(agent).settleLiquidity(ethers.parseEther("110"));

    const treasuryBefore = await asset.balanceOf(treasury.address);
    await vault.connect(owner).withdrawProtocolFees();
    const treasuryAfter = await asset.balanceOf(treasury.address);

    expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("0.5"));
    expect(await vault.protocolFeeAccrued()).to.equal(0n);
  });

  it("Should enforce max allocation cap per agent", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    // Max allocation = 20% of 500 = 100 AUSD
    // Requesting 101 should revert
    await expect(vault.connect(agent).requestLiquidity(ethers.parseEther("101")))
      .to.be.revertedWith("Exceeds max allocation for agent");
  });
});
