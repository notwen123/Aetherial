"use client";

import React, { useState, useEffect } from 'react';
import {
  Terminal as TerminalIcon, Wallet, Activity, Shield, Server,
  ChevronRight, ArrowUpRight, TrendingUp, LayoutDashboard, Trophy,
  PieChart as AnalyticsIcon, ShieldCheck, Vault as VaultIcon, Lock, Zap, Loader2, AlertCircle,
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useConnectModal, ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import Image from 'next/image';
import Link from 'next/link';

import { useAetherial, useVaultStats, useAgentData } from '@/hooks/useAetherial';
import { Leaderboard } from '@/components/Leaderboard';
import { Vaults } from '@/components/Vaults';
import { EASHub } from '@/components/EASHub';
import { PortfolioAnalytics } from '@/components/PortfolioAnalytics';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'DASHBOARD' | 'VAULTS' | 'ANALYTICS' | 'LEADERBOARD' | 'TRANSPARENCY';

export default function AetherialTerminal() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');

  const [isAuditing, setIsAuditing] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<'success' | 'err'>('success');
  const [txError, setTxError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const {
    lpShares,
    lpAssetValue, lpAssetValueFormatted, 
    pendingYield, pendingYieldFormatted, 
    ausdBalance, ausdBalanceFormatted,
    deposit, withdraw, claimYield, faucet, isTxPending, refetchAll, isDeployed,
    assetSymbol, yieldSymbol, canClaim, secondsUntilNextFaucet,
  } = useAetherial();

  const { totalAssets, totalAssetsFormatted, utilization } = useVaultStats();
  const { creditScore, isWhitelisted } = useAgentData(address);

  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'success' | 'err'; tx?: string }[]>([]);

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info', tx?: string) =>
    setLogs(prev => [{ msg, type, tx }, ...prev].slice(0, 12));

  useEffect(() => {
    if (isConnected) {
      addLog('System initialized. Connected to OKX X Layer Testnet.', 'info');
      if (isDeployed) addLog('Vault contracts loaded. Reading live state...', 'success');
      else addLog('Contracts not deployed yet. Deploy first.', 'err');
    }
  }, [isConnected, isDeployed]);

  const handleFaucet = async () => {
    addLog('Requesting 100 testnet AUSD...', 'info');
    try {
      const tx = await faucet();
      setLastTxHash(tx);
      setTxStatus('success');
      setIsTxModalOpen(true);
      addLog('AUSD claim confirmed. Balance updated.', 'success', tx);
      refetchAll();
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Rejected';
      addLog(`Faucet Failed: ${msg}`, 'err');
      setTxError(msg);
      setTxStatus('err');
      setIsTxModalOpen(true);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmt) return;
    addLog(`Initiating Supply Cycle for ${depositAmt} ${assetSymbol}...`, 'info');
    try {
      addLog('Step 1/2: Verifying Allowance...', 'info');
      const tx = await deposit(depositAmt);
      setLastTxHash(tx);
      setTxStatus('success');
      setIsTxModalOpen(true);
      addLog(`Step 2/2: Deposit confirmed. Asset locked in vault.`, 'success', tx);
      setDepositAmt('');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Rejected';
      addLog(`Operation Failed: ${msg}`, 'err');
      setTxError(msg);
      setTxStatus('err');
      setIsTxModalOpen(true);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt) return;
    addLog(`Withdrawing ${withdrawAmt} shares...`, 'info');
    try {
      const tx = await withdraw(withdrawAmt);
      setLastTxHash(tx);
      setTxStatus('success');
      setIsTxModalOpen(true);
      addLog(`Step 2/2: Withdrawal confirmed. Shares redeemed.`, 'success', tx);
      setWithdrawAmt('');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Rejected';
      addLog(`Failed: ${msg}`, 'err');
      setTxError(msg);
      setTxStatus('err');
      setIsTxModalOpen(true);
    }
  };

  const handleClaimYield = async () => {
    addLog('Claiming yield...', 'info');
    try {
      const tx = await claimYield();
      setLastTxHash(tx);
      setTxStatus('success');
      setIsTxModalOpen(true);
      addLog(`Yield claimed and re-invested.`, 'success', tx);
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Rejected';
      addLog(`Failed: ${msg}`, 'err');
      setTxError(msg);
      setTxStatus('err');
      setIsTxModalOpen(true);
    }
  };

  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    addLog('Initiating Autonomous Audit Cycle...', 'info');
    
    try {
      const res = await fetch('/api/agents/cycle', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        addLog(`Audit Complete. New Score: ${data.score}/1000`, 'success');
        if (data.easUID) addLog(`EAS Anchored: ${data.easUID.slice(0, 18)}...`, 'success');
        data.logs?.forEach((l: string) => addLog(l, 'info'));
        refetchAll();
      } else {
        addLog(`Audit Failed: ${data.error}`, 'err');
        data.logs?.forEach((l: string) => addLog(l, 'err'));
      }
    } catch (e: any) {
      addLog(`Network Error: ${e.message}`, 'err');
    } finally {
      setIsAuditing(false);
    }
  };


  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Control' },
    { id: 'VAULTS', icon: VaultIcon, label: 'Vaults' },
    { id: 'ANALYTICS', icon: AnalyticsIcon, label: 'Portfolio' },
    { id: 'LEADERBOARD', icon: Trophy, label: 'Alpha' },
    { id: 'TRANSPARENCY', icon: ShieldCheck, label: 'Audits' },
  ];

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8 selection:bg-primary/30">
        <div className="max-w-[440px] w-full bg-zinc-950/50 border border-zinc-900 p-10 rounded-2xl text-center space-y-8 shadow-2xl backdrop-blur-sm">
          <div className="w-20 h-20 bg-primary/5 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto">
            <Lock size={36} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Access Restricted</h1>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              Connect your wallet to access the Aetherial Prime Broker on OKX X Layer Testnet.
            </p>
          </div>
          <button
            onClick={() => openConnectModal?.()}
            className="w-full bg-primary hover:bg-primary/90 text-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
          >
            <Wallet size={18} /> Authorize Connection
          </button>
          <Link href="/" className="block text-[10px] text-zinc-600 font-bold hover:text-primary transition-colors uppercase tracking-[0.2em]">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-400 font-sans selection:bg-primary/30 selection:text-primary">
      {/* Navbar */}
      <nav className="h-20 border-b border-white/5 bg-black/80 backdrop-blur-2xl px-10 sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Left Column: Branding & Terminal Logic */}
        <div className="flex items-center justify-start gap-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
              <Image src="/logo.png" alt="Aetherial Logo" width={24} height={24} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black tracking-[0.2em] text-white">AETHERIAL</span>
              <span className="text-[9px] font-mono font-bold text-primary tracking-[0.1em]">TERMINAL_CORE</span>
            </div>
          </Link>
          <div className="h-6 w-px bg-white/10 mx-2" />
        </div>

        {/* Center Column: Control Switches (Guaranteed Centering) */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-[10px] uppercase tracking-[0.2em] font-black transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={13} strokeWidth={3} />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(163,230,53,0.6)] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em]">X-Layer Testnet Cluster Active</span>
          </div>
          
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                  })}
                >
                  {(() => {
                    if (!connected) return (
                      <button onClick={openConnectModal} className="px-5 py-2 bg-primary text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
                        Initialize Core
                      </button>
                    );
                    if (chain.unsupported) return (
                      <button onClick={openChainModal} className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[10px] font-bold uppercase">
                        Protocol Error: Wrong Network
                      </button>
                    );
                    return (
                      <button
                        onClick={openAccountModal}
                        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary group-hover:animate-ping" />
                        <span className="text-[11px] font-mono font-bold text-zinc-300 tracking-tight">{account.displayName}</span>
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-8">
        <div className="min-h-[600px]">

          {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Left column */}
              <div className="lg:col-span-8 space-y-8">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 p-10 rounded-[32px] hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-2 text-zinc-500 mb-6">
                      <Zap size={14} className="group-hover:text-primary transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.4em]">Deposited Value</span>
                    </div>
                    <div className="text-5xl font-bold text-white tracking-tighter">
                      {lpAssetValue === undefined ? (
                        <div className="h-12 w-32 bg-white/5 animate-pulse rounded-lg" />
                      ) : (
                        <>
                          {lpAssetValueFormatted}
                          <span className="text-sm font-bold text-zinc-600 ml-3">{assetSymbol}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-8 text-primary/80 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <TrendingUp size={12} /> {pendingYield === undefined ? '—' : pendingYieldFormatted} {yieldSymbol} Accrued
                    </div>
                  </div>

                  <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 p-10 rounded-[32px] hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-2 text-zinc-500 mb-6">
                      <ShieldCheck size={14} className="group-hover:text-primary transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.4em]">Credit Score</span>
                    </div>
                    <div className="text-5xl font-bold text-white tracking-tighter">
                      {creditScore}<span className="text-lg font-bold text-zinc-600 block sm:inline sm:ml-2">/1000</span>
                    </div>
                    <p className={`text-[10px] mt-8 font-bold uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-full inline-block ${isWhitelisted ? 'text-primary' : 'text-rose-400'}`}>
                      {isWhitelisted ? 'Whitelisted' : 'Restricted'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-b from-[#151515] to-[#0A0A0A] border border-primary/20 p-10 rounded-[32px] relative overflow-hidden group hover:border-primary/40 transition-all">
                    <div className="relative z-10 flex items-center gap-2 text-primary mb-6">
                      <Server size={14} />
                      <span className="text-[10px] uppercase font-bold tracking-[0.4em]">Vault TVL</span>
                    </div>
                    <div className="relative z-10 text-5xl font-bold text-white tracking-tighter">
                      {totalAssets === undefined ? (
                        <div className="h-12 w-32 bg-white/5 animate-pulse rounded-lg" />
                      ) : (
                        <>
                          {totalAssetsFormatted}
                          <span className="text-xs font-bold text-primary/40 uppercase block sm:inline sm:ml-2">AUSD</span>
                        </>
                      )}
                    </div>
                    <p className="relative z-10 text-[10px] text-zinc-500 mt-8 font-bold uppercase tracking-[0.2em]">
                      {utilization}% Utilization Rate
                    </p>
                    <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000">
                      <Activity size={240} strokeWidth={1} className="text-primary" />
                    </div>
                  </div>
                </div>

                {/* Operation Panel */}
                <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                  <div className="px-10 py-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-[0.4em] flex items-center gap-3">
                      <Wallet size={14} className="text-primary" /> Liquidity Handshake
                    </h3>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleFaucet} 
                        disabled={isTxPending || !canClaim}
                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 
                          ${!canClaim ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed' : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black'}`}
                      >
                        {!canClaim 
                          ? `Next Claim In ${Math.ceil(secondsUntilNextFaucet / 3600)}H` 
                          : 'Get 100 AUSD'}
                      </button>
                      <div className="flex items-center gap-2 bg-black px-4 py-2 rounded-full border border-white/5">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wallet</span>
                        <span className="text-[11px] text-white font-mono font-bold">
                          {ausdBalance === undefined ? '...' : ausdBalanceFormatted} {assetSymbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 space-y-10">
                    {/* Transaction Status Modal */}
                    <AnimatePresence>
                      {isTxModalOpen && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
                        >
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="max-w-md w-full bg-[#0A0A0A] border border-white/10 p-12 rounded-[40px] text-center relative overflow-hidden shadow-2xl"
                          >
                            {/* Decorative background flair */}
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 blur-[100px] -z-10 ${
                              txStatus === 'success' ? 'bg-primary/10' : 'bg-rose-500/10'
                            }`} />

                            <div className="mb-8 relative inline-flex">
                              <div className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse ${
                                txStatus === 'success' ? 'bg-primary/20' : 'bg-rose-500/20'
                              }`} />
                              <div className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-2xl ${
                                txStatus === 'success' 
                                  ? 'bg-primary shadow-primary/20' 
                                  : 'bg-rose-500 shadow-rose-500/20'
                              }`}>
                                {txStatus === 'success' ? (
                                  <ShieldCheck size={40} className="text-black" />
                                ) : (
                                  <AlertCircle size={40} className="text-white" />
                                )}
                              </div>
                            </div>

                            <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
                              {txStatus === 'success' ? 'Transmission Confirmed' : 'Transmission Failed'}
                            </h3>
                            <p className="text-zinc-500 mb-10 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
                              {txStatus === 'success' 
                                ? 'The delta rebalancing operation has been successfully committed to the X-Layer consensus layer.' 
                                : txError || 'Operational failure detected during consensus verification. Please retry.'}
                            </p>

                            <div className="space-y-3">
                              {lastTxHash && (
                                <a 
                                  href={`https://www.oklink.com/x-layer-testnet/tx/${lastTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-3 w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-90 transition-all group"
                                >
                                  View on Explorer <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                              )}
                              <button 
                                onClick={() => setIsTxModalOpen(false)}
                                className="w-full py-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
                              >
                                {txStatus === 'success' ? 'Dismiss Terminal' : 'Return to Core'}
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Deposit */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.4em] ml-2">Supply {assetSymbol}</label>
                      <div className="relative group/input">
                        <input
                          type="number" value={depositAmt}
                          onChange={e => setDepositAmt(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#080808] border border-white/5 rounded-3xl py-8 px-10 text-4xl font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:border-primary/40 transition-all shadow-inner"
                        />
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-600 tracking-widest uppercase">{assetSymbol}</span>
                      </div>
                    </div>

                    {/* Withdraw */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.4em]">Withdraw Shares</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                            Owned: {lpShares === undefined ? '...' : formatEther(lpShares)}
                          </span>
                          <button 
                            onClick={() => setWithdrawAmt(lpShares ? formatEther(lpShares) : '')}
                            className="text-[9px] text-primary font-black uppercase tracking-widest hover:text-white transition-colors"
                          >
                            [MAX]
                          </button>
                        </div>
                      </div>
                      <div className="relative group/input">
                        <input
                          type="number" value={withdrawAmt}
                          onChange={e => setWithdrawAmt(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#080808] border border-white/5 rounded-3xl py-8 px-10 text-4xl font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:border-white/20 transition-all shadow-inner"
                        />
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-600 tracking-widest uppercase">Shares</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                      <button onClick={handleDeposit} disabled={isTxPending || !depositAmt}
                        className="flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-black py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(163,230,53,0.15)] hover:shadow-[0_0_40px_rgba(163,230,53,0.25)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed col-span-1">
                        {isTxPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} strokeWidth={3} />}
                        Supply Capital
                      </button>
                      <button 
                        onClick={handleWithdraw} 
                        disabled={
                          isTxPending || 
                          !withdrawAmt || 
                          (lpShares !== undefined && parseEther(withdrawAmt || '0') > lpShares)
                        }
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed col-span-1"
                      >
                        {isTxPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        Withdraw
                      </button>
                      <button onClick={handleClaimYield} disabled={isTxPending || parseFloat(pendingYieldFormatted) === 0}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-primary/60 hover:text-primary border border-white/5 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed col-span-1">
                        <Zap size={16} /> Claim Yield
                      </button>
                    </div>

                    <div className="bg-black/40 border border-dashed border-white/5 rounded-3xl p-8 flex items-center gap-6">
                      <div className="w-14 h-14 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Shield size={24} className="text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Institutional Verification Active</p>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-md">
                          Every transaction generates an immutable EAS attestation. Secured by OKX X Layer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — telemetry */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="flex-1 bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl min-h-[500px]">
                  <div className="px-6 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-[0.4em] flex items-center gap-2">
                      <TerminalIcon size={14} className="text-primary" /> Telemetry Feed
                    </h3>
                    <div className="flex gap-1.5 opacity-30">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto space-y-4">
                    {logs.map((log, i) => (
                      <div key={i} className={`flex items-start gap-4 border-l-2 pl-4 transition-all duration-300 ${
                        log.type === 'success' ? 'border-primary text-primary/90' :
                        log.type === 'err' ? 'border-rose-500 text-rose-400' :
                        'border-zinc-800 text-zinc-500'
                      }`}>
                        <span className="text-[9px] opacity-25 font-black flex-shrink-0 tracking-widest">
                          [{new Date().toLocaleTimeString([], { hour12: false })}]
                        </span>
                        <p className="flex-1 font-bold leading-[1.8] tracking-tight flex items-center gap-2">
                          {log.msg}
                          {log.tx && (
                            <a 
                              href={`https://www.oklink.com/x-layer-testnet/tx/${log.tx}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[8px] text-primary hover:bg-primary hover:text-black transition-all font-black uppercase tracking-widest"
                            >
                              VIEW TX
                            </a>
                          )}
                        </p>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-10">
                        <Activity size={40} strokeWidth={1} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Awaiting Uplink...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 p-10 rounded-[32px] shadow-xl space-y-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Agent Attribution</h4>
                    <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] mt-2">Live Performance Metrics</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Credit Score', val: `${creditScore}/1000`, color: 'primary' },
                      { label: 'Vault Access', val: isWhitelisted ? 'GRANTED' : 'RESTRICTED', color: isWhitelisted ? 'primary' : 'rose' },
                      { label: 'Protocol Net', val: 'X-LAYER', color: 'primary' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/[0.03] pb-4">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">{s.label}</span>
                        <span className={`text-[11px] font-bold tracking-tight ${s.color === 'primary' ? 'text-white' : 'text-rose-400'}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('LEADERBOARD')}
                    className="w-full py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] hover:bg-white/[0.08] hover:text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                    View Global Alpha <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-[#0A0A0A] to-black border border-primary/10 p-10 rounded-[32px] shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Manual Override</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Trigger System Audit</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${isAuditing ? 'bg-amber-500 animate-ping' : 'bg-primary shadow-[0_0_12px_rgba(163,230,53,0.5)]'}`} />
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-[1.7] font-medium pb-2">
                    Force immediate metric attribution and EAS re-anchoring.
                  </p>
                  <button
                    onClick={handleTriggerAudit}
                    disabled={isAuditing}
                    className="w-full py-5 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50">
                    {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    {isAuditing ? 'Auditing...' : 'Initialize Audit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'VAULTS' && <Vaults />}
          {activeTab === 'ANALYTICS' && <PortfolioAnalytics />}
          {activeTab === 'LEADERBOARD' && <Leaderboard />}
          {activeTab === 'TRANSPARENCY' && <EASHub />}
        </div>
      </main>

      <footer className="mt-20 border-t border-zinc-900 bg-black p-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-2.5 h-2.5 bg-primary rounded-sm" />
            <span>Aetherial Prime © 2026</span>
          </div>
          <Link href="/docs" className="hover:text-zinc-300 transition-colors">Whitepaper</Link>
        </div>
        <div className="mt-6 sm:mt-0 flex items-center gap-4">
          <div className="flex items-center gap-2 py-1 px-3 bg-zinc-950/50 rounded-full border border-zinc-900">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
            <span>X-Layer Testnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
