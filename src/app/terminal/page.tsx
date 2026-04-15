"use client";

import React, { useState, useEffect } from 'react';
import {
  Terminal as TerminalIcon, Wallet, Activity, Shield, Server,
  ChevronRight, ArrowUpRight, TrendingUp, LayoutDashboard, Trophy,
  PieChart as AnalyticsIcon, ShieldCheck, Vault as VaultIcon, Lock, Zap, Loader2,
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatEther } from 'viem';
import Image from 'next/image';
import Link from 'next/link';

import { useAetherial, useVaultStats, useAgentData } from '@/hooks/useAetherial';
import { Leaderboard } from '@/components/Leaderboard';
import { Vaults } from '@/components/Vaults';
import { EASHub } from '@/components/EASHub';
import { PortfolioAnalytics } from '@/components/PortfolioAnalytics';

type Tab = 'DASHBOARD' | 'VAULTS' | 'ANALYTICS' | 'LEADERBOARD' | 'TRANSPARENCY';

export default function AetherialTerminal() {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'success' | 'err' }[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const {
    lpAssetValueFormatted, pendingYieldFormatted, ausdBalanceFormatted,
    deposit, withdraw, claimYield, isTxPending, refetchAll, isDeployed,
    assetSymbol, yieldSymbol,
  } = useAetherial();

  const { totalAssetsFormatted, utilization } = useVaultStats();
  const { creditScore, isWhitelisted } = useAgentData(address);

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info') =>
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 12));

  useEffect(() => {
    if (isConnected) {
      addLog('System initialized. Connected to OKX X Layer Testnet.', 'info');
      if (isDeployed) addLog('Vault contracts loaded. Reading live state...', 'success');
      else addLog('Contracts not deployed yet. Deploy first.', 'err');
    }
  }, [isConnected, isDeployed]);

  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [showTxPopup, setShowTxPopup] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmt) return;
    addLog(`Approving & depositing ${depositAmt} ${assetSymbol}...`, 'info');
    try {
      const tx = await deposit(depositAmt);
      setLastTxHash(tx);
      setShowTxPopup(true);
      addLog(`Deposit confirmed. Tx: ${tx.slice(0, 14)}...`, 'success');
      setDepositAmt('');
      setTimeout(refetchAll, 3000);
      setTimeout(() => setShowTxPopup(false), 8000);
    } catch (e: any) {
      addLog(`Failed: ${e.shortMessage ?? e.message ?? 'Rejected'}`, 'err');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt) return;
    addLog(`Withdrawing ${withdrawAmt} shares...`, 'info');
    try {
      const tx = await withdraw(withdrawAmt);
      setLastTxHash(tx);
      setShowTxPopup(true);
      addLog(`Withdrawal confirmed. Tx: ${tx.slice(0, 14)}...`, 'success');
      setWithdrawAmt('');
      setTimeout(refetchAll, 3000);
      setTimeout(() => setShowTxPopup(false), 8000);
    } catch (e: any) {
      addLog(`Failed: ${e.shortMessage ?? e.message ?? 'Rejected'}`, 'err');
    }
  };

  const handleClaimYield = async () => {
    addLog('Claiming yield...', 'info');
    try {
      const tx = await claimYield();
      setLastTxHash(tx);
      setShowTxPopup(true);
      addLog(`Yield claimed. Tx: ${tx.slice(0, 14)}...`, 'success');
      setTimeout(refetchAll, 3000);
      setTimeout(() => setShowTxPopup(false), 8000);
    } catch (e: any) {
      addLog(`Failed: ${e.shortMessage ?? e.message ?? 'Rejected'}`, 'err');
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
            onClick={() => connect({ connector: injected() })}
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
      {/* Transaction HUD Popup */}
      {showTxPopup && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in fade-in slide-in-from-right-10 duration-500">
          <div className="bg-[#0F0F0F] border border-primary/20 p-8 rounded-[32px] shadow-2xl backdrop-blur-3xl min-w-[320px] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-[progress_8s_linear]" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Zap size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Transaction Anchored</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">X Layer Testnet Confirmation</p>
                </div>
              </div>
              <button onClick={() => setShowTxPopup(false)} className="text-zinc-700 hover:text-white transition-colors">
                <Lock size={14} />
              </button>
            </div>
            <a 
              href={`https://www.oklink.com/xlayer-test/tx/${lastTxHash}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl text-[10px] font-black text-primary uppercase tracking-[0.3em] transition-all group-hover:scale-[1.02]">
              View on OKLink <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      )}
      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 bg-black/80 backdrop-blur-2xl flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 flex items-center justify-center group-hover:bg-primary/5 transition-all duration-500 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Aetherial Logo" width={24} height={24} className="object-contain" />
            </div>
            <span className="text-lg font-black text-white tracking-tighter">
              AETHERIAL <span className="text-primary ml-0.5 uppercase tracking-widest">PRIME</span>
            </span>
          </Link>
          <div className="h-4 w-px bg-white/5 mx-2" />
          <div className="flex items-center gap-8">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as Tab)}
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:text-white ${
                  activeTab === item.id ? 'text-white' : 'text-zinc-500'
                }`}>
                <item.icon size={14} className={activeTab === item.id ? 'text-primary' : ''} /> {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(163,230,53,0.6)] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-[0.2em]">X-Layer Active</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Wallet size={14} />
            <span className="text-[11px] font-mono font-bold tracking-tight">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
          <button onClick={() => disconnect()} className="p-2 text-zinc-600 hover:text-rose-500 transition-colors" title="Disconnect">
            <Lock size={16} />
          </button>
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
                      <Activity size={14} className="group-hover:text-primary transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.4em]">Deposited Value</span>
                    </div>
                    <div className="text-5xl font-bold text-white tracking-tighter">
                      {lpAssetValueFormatted}
                      <span className="text-sm font-bold text-zinc-600 ml-3">{assetSymbol}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-8 text-primary/80 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <TrendingUp size={12} /> {pendingYieldFormatted} {yieldSymbol} Accrued
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
                      {totalAssetsFormatted}
                      <span className="text-xs font-bold text-primary/40 uppercase block sm:inline sm:ml-2">AUSD</span>
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
                    <div className="flex items-center gap-2 bg-black px-4 py-2 rounded-full border border-white/5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wallet</span>
                      <span className="text-[11px] text-white font-mono font-bold">{ausdBalanceFormatted} {assetSymbol}</span>
                    </div>
                  </div>

                  <div className="p-10 space-y-10">
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
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.4em] ml-2">Withdraw Shares</label>
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
                      <button onClick={handleWithdraw} disabled={isTxPending || !withdrawAmt}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed col-span-1">
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
                        <p className="flex-1 font-bold leading-[1.8] tracking-tight">{log.msg}</p>
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
