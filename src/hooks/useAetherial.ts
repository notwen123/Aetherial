'use client';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, useSwitchChain, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';
import deployments from '../deployments.json';

const VAULT_ADDRESS = deployments.aetherial.vault as `0x${string}`;
const REGISTRY_ADDRESS = deployments.aetherial.registry as `0x${string}`;
const AUSD_ADDRESS = deployments.aetherial.ausd as `0x${string}`;
const EAS_ADDRESS = deployments.eas.address as `0x${string}`;

const VAULT_ABI = [
  { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'shareAmount', type: 'uint256' }], outputs: [] },
  { name: 'claimYield', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'lpShares', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'lpAssetValue', type: 'function', stateMutability: 'view', inputs: [{ name: 'lp', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'pendingYieldOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'lp', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalAllocated', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalShares', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'accRewardPerShare', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const REGISTRY_ABI = [
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'isRegistered', type: 'bool' },
        { name: 'creditScore', type: 'uint256' },
        { name: 'easAttestationUID', type: 'string' },
        { name: 'isWhitelisted', type: 'bool' },
        { name: 'lastUpdated', type: 'uint256' },
      ],
    }],
  },
  { name: 'getRegisteredAgents', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { name: 'totalAgents', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'faucet', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'lastFaucetClaim', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

const isDeployed = !!(VAULT_ADDRESS && VAULT_ADDRESS.length > 4);

// ── Main LP hook ─────────────────────────────────────────────────────────────
export function useAetherial() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const chainId = useChainId();
  const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>();

  const enabled = isDeployed && !!address;

  const { data: lpShares, refetch: refetchShares } = useReadContract({
    address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'lpShares',
    args: [address!], chainId: 1952, query: { enabled },
  });

  const { data: lpAssetValue, refetch: refetchAssetValue } = useReadContract({
    address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'lpAssetValue',
    args: [address!], chainId: 1952, query: { enabled },
  });

  const { data: pendingYield, refetch: refetchYield } = useReadContract({
    address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'pendingYieldOf',
    args: [address!], chainId: 1952, query: { enabled },
  });

  const { data: ausdBalance, refetch: refetchAusd } = useReadContract({
    address: AUSD_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf',
    args: [address!], chainId: 1952, query: { enabled },
  });

  const { data: ausdAllowance, refetch: refetchAllowance } = useReadContract({
    address: AUSD_ADDRESS, abi: ERC20_ABI, functionName: 'allowance',
    args: [address!, VAULT_ADDRESS], chainId: 1952, query: { enabled },
  });

  const publicClient = usePublicClient();

  const { isLoading: isTxPending } = useWaitForTransactionReceipt({
    hash: pendingTx,
  });

  const { data: lastClaim, refetch: refetchClaim } = useReadContract({
    address: AUSD_ADDRESS, abi: ERC20_ABI, functionName: 'lastFaucetClaim',
    args: [address!],
    chainId: 1952,
    query: { enabled: !!address && isDeployed, refetchInterval: 30_000 },
  });

  const refetchAll = () => {
    refetchShares(); refetchAssetValue(); refetchYield();
    refetchAusd(); refetchAllowance(); refetchClaim();
  };

  const lastClaimTime = lastClaim ? Number(lastClaim) : 0;
  const now = Math.floor(Date.now() / 1000);
  const cooldownPeriod = 24 * 60 * 60;
  const canClaim = lastClaimTime === 0 || now >= lastClaimTime + cooldownPeriod;
  const secondsUntilNextFaucet = Math.max(0, (lastClaimTime + cooldownPeriod) - now);

  const faucet = async () => {
    if (chainId !== 1952) await switchChainAsync({ chainId: 1952 });
    
    const tx = await writeContractAsync({
      address: AUSD_ADDRESS, abi: ERC20_ABI,
      functionName: 'faucet', args: [],
    });
    setPendingTx(tx);

    // Wait for confirmation to ensure balance is updated before returning
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: tx });
    }

    return tx;
  };

  // Approve then deposit
  const deposit = async (amountEther: string) => {
    const amount = parseEther(amountEther);
    
    // 1. Force chain switch to 195 if needed
    if (chainId !== 1952) {
      await switchChainAsync({ chainId: 1952 });
    }

    // 2. Check balance
    if (!ausdBalance || (ausdBalance as bigint) < amount) {
      throw new Error(`Insufficient AUSD balance. You need ${amountEther} AUSD.`);
    }

    // 3. Approve if needed (Infinite Approval for UX)
    if (!ausdAllowance || (ausdAllowance as bigint) < amount) {
      const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      const approveTxHash = await writeContractAsync({
        address: AUSD_ADDRESS, abi: ERC20_ABI, chainId: 1952,
        functionName: 'approve', args: [VAULT_ADDRESS, MAX_UINT256],
      });
      setPendingTx(approveTxHash);
      
      // WAIT for approval to be mined before proceeding
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
        await refetchAllowance();
      }
    }

    // 4. Deposit
    const tx = await writeContractAsync({
      address: VAULT_ADDRESS, abi: VAULT_ABI, chainId: 1952,
      functionName: 'deposit', args: [amount],
    });
    setPendingTx(tx);
    return tx;
  };

  // Withdraw by share amount
  const withdraw = async (shareAmountEther: string) => {
    const shares = parseEther(shareAmountEther);

    if (chainId !== 1952) {
      await switchChainAsync({ chainId: 1952 });
    }

    // 2. Check shares balance
    if (!lpShares || (lpShares as bigint) < shares) {
      throw new Error(`Insufficient share balance. You have ${lpShares ? formatEther(lpShares) : '0'} shares.`);
    }

    const tx = await writeContractAsync({
      address: VAULT_ADDRESS, abi: VAULT_ABI, chainId: 1952,
      functionName: 'withdraw', args: [shares],
    });
    setPendingTx(tx);
    return tx;
  };

  const claimYield = async () => {
    if (chainId !== 1952) {
      await switchChainAsync({ chainId: 1952 });
    }

    const tx = await writeContractAsync({
      address: VAULT_ADDRESS, abi: VAULT_ABI, chainId: 1952,
      functionName: 'claimYield', args: [],
    });
    setPendingTx(tx);
    return tx;
  };

  return {
    // balances
    lpShares: lpShares as bigint | undefined,
    lpAssetValue: lpAssetValue as bigint | undefined,
    pendingYield: pendingYield as bigint | undefined,
    ausdBalance: ausdBalance as bigint | undefined,
    // formatted helpers
    lpAssetValueFormatted: lpAssetValue ? new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(Number(formatEther(lpAssetValue as bigint))) : '0.00',
    pendingYieldFormatted: pendingYield ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(Number(formatEther(pendingYield as bigint))) : '0.000000',
    ausdBalanceFormatted: ausdBalance ? new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(Number(formatEther(ausdBalance as bigint))) : '0.00',
    // renamed labels for UI consistency
    assetSymbol: 'AUSD',
    yieldSymbol: 'AUSD',
    // actions
    deposit, withdraw, claimYield, faucet,
    canClaim,
    secondsUntilNextFaucet,
    isTxPending,
    refetchAll,
    isDeployed,
  };
}

// ── Vault global stats hook ───────────────────────────────────────────────────
export function useVaultStats() {
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'totalAssets',
    chainId: 1952,
    query: { enabled: isDeployed, refetchInterval: 15_000 },
  });
  const { data: totalAllocated } = useReadContract({
    address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'totalAllocated',
    chainId: 1952,
    query: { enabled: isDeployed, refetchInterval: 15_000 },
  });
  const { data: totalShares } = useReadContract({
    address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'totalShares',
    chainId: 1952,
    query: { enabled: isDeployed, refetchInterval: 15_000 },
  });

  const ta = totalAssets as bigint | undefined;
  const tl = totalAllocated as bigint | undefined;
  const available = (ta !== undefined && tl !== undefined) ? (ta - tl) : undefined;
  const utilization = (ta !== undefined && tl !== undefined && ta > 0n)
    ? ((Number(tl) / Number(ta)) * 100).toFixed(1)
    : '0.0';

  return {
    totalAssets: ta,
    totalAllocated: tl,
    totalShares: totalShares as bigint | undefined,
    available,
    utilization,
    totalAssetsFormatted: ta !== undefined ? new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(Number(formatEther(ta))) : '—',
    totalAllocatedFormatted: tl !== undefined ? new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(Number(formatEther(tl))) : '—',
    availableFormatted: available !== undefined ? new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(Number(formatEther(available))) : '—',
  };
}

// ── Agent data hook ───────────────────────────────────────────────────────────
export function useAgentData(agentAddress?: `0x${string}`) {
  const { data: agentInfo } = useReadContract({
    address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'getAgent',
    args: [agentAddress!],
    chainId: 1952,
    query: { enabled: isDeployed && !!agentAddress, refetchInterval: 30_000 },
  });

  return {
    agentInfo: agentInfo as {
      isRegistered: boolean;
      creditScore: bigint;
      easAttestationUID: string;
      isWhitelisted: boolean;
      lastUpdated: bigint;
    } | undefined,
    creditScore: agentInfo ? Number((agentInfo as any).creditScore) : 0,
    isWhitelisted: agentInfo ? (agentInfo as any).isWhitelisted : false,
    easUID: agentInfo ? (agentInfo as any).easAttestationUID : '',
  };
}

// ── All registered agents hook ────────────────────────────────────────────────
export function useAllAgents() {
  const { data: agentAddresses, isLoading } = useReadContract({
    address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'getRegisteredAgents',
    query: { enabled: isDeployed, refetchInterval: 30_000 },
  });

  const { data: totalAgents } = useReadContract({
    address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'totalAgents',
    query: { enabled: isDeployed },
  });

  return {
    agentAddresses: (agentAddresses as `0x${string}`[] | undefined) ?? [],
    totalAgents: totalAgents ? Number(totalAgents) : 0,
    isLoading,
  };
}
