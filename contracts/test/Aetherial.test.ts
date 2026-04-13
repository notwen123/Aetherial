import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AetherialVault, AgentRegistry, MockERC20 } from "../typechain-types";

describe("Aetherial Protocol", function () {
  let vault: AetherialVault;
  let registry: AgentRegistry;
  let asset: MockERC20;
  let owner: SignerWithAddress;
  let lp: SignerWithAddress;
  let agent: SignerWithAddress;

  beforeEach(async function () {
    [owner, lp, agent] = await ethers.getSigners();

    // 1. Deploy Mock Asset
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    asset = await MockERC20.deploy("USDC Mock", "USDC", 18);
    await asset.waitForDeployment();

    // 2. Deploy Registry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy();
    await registry.waitForDeployment();

    // 3. Deploy Vault
    const AetherialVault = await ethers.getContractFactory("AetherialVault");
    vault = await AetherialVault.deploy(await registry.getAddress(), await asset.getAddress());
    await vault.waitForDeployment();

    // Setup: LP has funds
    await asset.mint(lp.address, ethers.parseEther("1000"));
    await asset.connect(lp).approve(await vault.getAddress(), ethers.parseEther("1000"));
  });

  it("Should allow LP to deposit and withdraw", async function () {
    await vault.connect(lp).deposit(ethers.parseEther("100"));
    expect(await vault.lpBalances(lp.address)).to.equal(ethers.parseEther("100"));
    
    await vault.connect(lp).withdraw(ethers.parseEther("50"));
    expect(await vault.lpBalances(lp.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow whitelisted agents to borrow liquidity", async function () {
    // Register and Whitelist agent
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);

    // LP deposits
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    // Agent borrows
    await expect(vault.connect(agent).requestLiquidity(ethers.parseEther("100")))
      .to.emit(vault, "LiquidityAllocated");
    
    expect(await asset.balanceOf(agent.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should prevent non-whitelisted agents from borrowing", async function () {
    await registry.connect(agent).registerAgent();
    // No whitelist yet
    
    await vault.connect(lp).deposit(ethers.parseEther("500"));

    await expect(vault.connect(agent).requestLiquidity(ethers.parseEther("100")))
      .to.be.revertedWith("Agent not whitelisted");
  });

  it("Should settle trades with profit", async function () {
    await registry.connect(agent).registerAgent();
    await registry.connect(owner).setWhitelisted(agent.address, true);
    await vault.connect(lp).deposit(ethers.parseEther("500"));
    
    await vault.connect(agent).requestLiquidity(ethers.parseEther("100"));
    
    // Agent makes profit and returns 105 USDC
    await asset.mint(agent.address, ethers.parseEther("5"));
    await asset.connect(agent).approve(await vault.getAddress(), ethers.parseEther("105"));
    
    await expect(vault.connect(agent).settleLiquidity(ethers.parseEther("105")))
      .to.emit(vault, "LiquiditySetted")
      .withArgs(agent.address, ethers.parseEther("105"), ethers.parseEther("5"));
  });
});
