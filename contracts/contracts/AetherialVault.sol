// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentRegistry.sol";

/**
 * @title AetherialVault
 * @dev The core liquidity pool for Aetherial Prime Broker.
 *
 *  Yield mechanics:
 *   - LPs deposit AUSD and receive a proportional share of the vault (tracked via lpShares).
 *   - When an agent settles a profitable trade, profit is split:
 *       • PROTOCOL_FEE_BPS  (5%)  → protocol treasury
 *       • AGENT_FEE_BPS     (10%) → agent reward
 *       • remainder         (85%) → distributed to all LPs pro-rata via accRewardPerShare
 *   - LP yield is claimable at any time via claimYield().
 *
 *  Credit gating:
 *   - Agent must be whitelisted in AgentRegistry (score >= 500).
 *   - Max borrow per agent is capped at MAX_ALLOCATION_BPS of totalLPBalance.
 */
contract AetherialVault is ReentrancyGuard, Ownable {
    AgentRegistry public registry;
    IERC20 public asset;

    // ── Fee config ──────────────────────────────────────────────────────────
    uint256 public constant PROTOCOL_FEE_BPS = 500;   // 5%
    uint256 public constant AGENT_FEE_BPS    = 1000;  // 10%
    uint256 public constant BPS_DENOMINATOR  = 10000;

    /// Max single-agent allocation as % of total LP balance (20%)
    uint256 public constant MAX_ALLOCATION_BPS = 2000;

    // ── LP accounting ────────────────────────────────────────────────────────
    uint256 public totalShares;
    mapping(address => uint256) public lpShares;

    /// Reward accumulator — scaled by 1e18 for precision
    uint256 public accRewardPerShare;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingYield;

    // ── Agent accounting ─────────────────────────────────────────────────────
    uint256 public totalAllocated;
    mapping(address => uint256) public activeAllocations;

    // ── Treasury ─────────────────────────────────────────────────────────────
    address public treasury;
    uint256 public protocolFeeAccrued;

    // ── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed lp, uint256 amount, uint256 shares);
    event Withdrawn(address indexed lp, uint256 amount, uint256 shares);
    event YieldClaimed(address indexed lp, uint256 amount);
    event LiquidityAllocated(address indexed agent, uint256 amount);
    event LiquiditySettled(address indexed agent, uint256 repayment, uint256 profit);
    event ProtocolFeeWithdrawn(address indexed treasury, uint256 amount);

    constructor(
        address _registry,
        address _asset,
        address _treasury
    ) Ownable(msg.sender) {
        registry = AgentRegistry(_registry);
        asset = IERC20(_asset);
        treasury = _treasury;
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    /// Total assets currently held in vault (deposited - allocated)
    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this)) - protocolFeeAccrued;
    }

    /// Convert asset amount → shares (at current ratio)
    function _toShares(uint256 amount) internal view returns (uint256) {
        if (totalShares == 0 || totalAssets() == 0) return amount;
        return (amount * totalShares) / totalAssets();
    }

    /// Convert shares → asset amount
    function _toAssets(uint256 shares) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares * totalAssets()) / totalShares;
    }

    /// Harvest pending yield for an LP before any share change
    function _harvest(address lp) internal {
        if (lpShares[lp] > 0) {
            uint256 earned = (lpShares[lp] * accRewardPerShare) / 1e18 - rewardDebt[lp];
            if (earned > 0) pendingYield[lp] += earned;
        }
        rewardDebt[lp] = (lpShares[lp] * accRewardPerShare) / 1e18;
    }

    // ── LP functions ─────────────────────────────────────────────────────────

    /**
     * @dev Deposit AUSD into the vault. Receive proportional shares.
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        _harvest(msg.sender);

        uint256 shares = _toShares(amount);
        asset.transferFrom(msg.sender, address(this), amount);

        lpShares[msg.sender] += shares;
        totalShares += shares;

        rewardDebt[msg.sender] = (lpShares[msg.sender] * accRewardPerShare) / 1e18;

        emit Deposited(msg.sender, amount, shares);
    }

    /**
     * @dev Withdraw AUSD from the vault by burning shares.
     */
    function withdraw(uint256 shareAmount) external nonReentrant {
        require(lpShares[msg.sender] >= shareAmount, "Insufficient shares");

        _harvest(msg.sender);

        uint256 assets = _toAssets(shareAmount);
        require(assets <= totalAssets() - totalAllocated, "Liquidity locked in active trades");

        lpShares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        rewardDebt[msg.sender] = (lpShares[msg.sender] * accRewardPerShare) / 1e18;

        asset.transfer(msg.sender, assets);
        emit Withdrawn(msg.sender, assets, shareAmount);
    }

    /**
     * @dev Claim accumulated yield rewards.
     */
    function claimYield() external nonReentrant {
        _harvest(msg.sender);
        uint256 amount = pendingYield[msg.sender];
        require(amount > 0, "No yield to claim");
        pendingYield[msg.sender] = 0;
        asset.transfer(msg.sender, amount);
        emit YieldClaimed(msg.sender, amount);
    }

    /**
     * @dev View pending yield for an LP without state change.
     */
    function pendingYieldOf(address lp) external view returns (uint256) {
        uint256 earned = 0;
        if (lpShares[lp] > 0) {
            earned = (lpShares[lp] * accRewardPerShare) / 1e18 - rewardDebt[lp];
        }
        return pendingYield[lp] + earned;
    }

    /**
     * @dev View LP's current asset value (principal + accrued yield).
     */
    function lpAssetValue(address lp) external view returns (uint256) {
        return _toAssets(lpShares[lp]);
    }

    // ── Agent functions ───────────────────────────────────────────────────────

    /**
     * @dev Whitelisted agent requests liquidity to execute a trade.
     *      Capped at MAX_ALLOCATION_BPS of total LP balance.
     */
    function requestLiquidity(uint256 amount) external nonReentrant {
        AgentRegistry.Agent memory agent = registry.getAgent(msg.sender);
        require(agent.isWhitelisted, "Agent not whitelisted");
        require(amount > 0, "Amount must be > 0");

        uint256 available = totalAssets() - totalAllocated;
        require(amount <= available, "Insufficient vault liquidity");

        uint256 maxAlloc = (totalAssets() * MAX_ALLOCATION_BPS) / BPS_DENOMINATOR;
        require(
            activeAllocations[msg.sender] + amount <= maxAlloc,
            "Exceeds max allocation for agent"
        );

        activeAllocations[msg.sender] += amount;
        totalAllocated += amount;

        asset.transfer(msg.sender, amount);
        emit LiquidityAllocated(msg.sender, amount);
    }

    /**
     * @dev Agent returns liquidity after trade execution.
     *      Profit is split: 5% protocol, 10% agent, 85% LPs.
     * @param repaymentAmount Total amount being returned (principal + profit).
     */
    function settleLiquidity(uint256 repaymentAmount) external nonReentrant {
        uint256 allocation = activeAllocations[msg.sender];
        require(allocation > 0, "No active allocation");
        require(repaymentAmount >= allocation, "Must repay at least principal");

        asset.transferFrom(msg.sender, address(this), repaymentAmount);

        activeAllocations[msg.sender] = 0;
        totalAllocated -= allocation;

        uint256 profit = repaymentAmount - allocation;

        if (profit > 0 && totalShares > 0) {
            uint256 protocolFee = (profit * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
            uint256 agentFee    = (profit * AGENT_FEE_BPS)    / BPS_DENOMINATOR;
            uint256 lpProfit    = profit - protocolFee - agentFee;

            // Accrue protocol fee (claimable by treasury)
            protocolFeeAccrued += protocolFee;

            // Pay agent fee directly
            if (agentFee > 0) {
                asset.transfer(msg.sender, agentFee);
            }

            // Distribute LP profit via accumulator
            if (lpProfit > 0) {
                accRewardPerShare += (lpProfit * 1e18) / totalShares;
            }
        }

        emit LiquiditySettled(msg.sender, repaymentAmount, profit);
    }

    // ── Admin functions ───────────────────────────────────────────────────────

    /**
     * @dev Withdraw accrued protocol fees to treasury.
     */
    function withdrawProtocolFees() external onlyOwner {
        uint256 amount = protocolFeeAccrued;
        require(amount > 0, "No fees to withdraw");
        protocolFeeAccrued = 0;
        asset.transfer(treasury, amount);
        emit ProtocolFeeWithdrawn(treasury, amount);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }
}
