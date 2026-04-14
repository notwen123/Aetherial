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

  const handleDeposit = async () => {
    if (!depositAmt) return;
    addLog(`Approving & depositing ${depositAmt} AUSD...`, 'info');
    try {
      const tx = await deposit(depositAmt);
      addLog(`Deposit confirmed. Tx: ${tx.slice(0, 14)}...`, 'success');
      setDepositAmt('');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      addLog(`Failed: ${e.shortMessage ?? e.message ?? 'Rejected'}`, 'err');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt) return;
    addLog(`Withdrawing ${withdrawAmt} shares...`, 'info');
    try {
      const tx = await withdraw(withdrawAmt);
      addLog(`Withdrawal confirmed. Tx: ${tx.slice(0, 14)}...`, 'success');
      setWithdrawAmt('');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      addLog(`Failed: ${e.shortMessage ?? e.message ?? 'Rejected'}`, 'err');
    }
  };

  const handleClaimYield = async () => {
    addLog('Claiming yield...', 'info');
    try {
      const tx = await claimYield();
      addLog(`Yield claimed. Tx: ${tx.slice(0, 14)}...`, 'success');
      setTimeout(refetchAll, 3000);
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 selection:bg-indigo-500/30">
        <div className="max-w-[440px] w-full bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl text-center space-y-8 shadow-2xl backdrop-blur-sm">
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto">
            <Lock size={36} className="text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">Access Restricted</h1>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              Connect your wallet to access the Aetherial Prime Broker on OKX X Layer Testnet.
            </p>
          </div>
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
          >
            <Wallet size={18} /> Authorize Connection
          </button>
          <Link href="/" className="block text-[10px] text-zinc-600 font-bold hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Shield className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-white tracking-tighter">
              AETHERIAL <span className="text-indigo-500 italic ml-0.5">PRIME</span>
            </span>
          </Link>
          <div className="h-4 w-px bg-zinc-800 mx-2" />
          <div className="flex items-center gap-6">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as Tab)}
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === item.id ? 'text-indigo-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <item.icon size={14} /> {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">X-Layer Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 border border-indigo-600/30 rounded-lg text-indigo-400">
            <Wallet size={14} />
            <span className="text-xs font-mono font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all group">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                      <Activity size={14} className="group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">My Deposited Value</span>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono tracking-tight">
                      {lpAssetValueFormatted}
                      <span className="text-sm font-normal text-zinc-500 ml-2 italic">AUSD</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      <TrendingUp size={10} /> Yield: {pendingYieldFormatted} AUSD pending
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all group">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                      <ShieldCheck size={14} className="group-hover:text-amber-500 transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Agent Credit Score</span>
                    </div>
                    <div className="text-3xl font-bold text-white italic tracking-tighter">
                      {creditScore} <span className="text-sm font-normal text-zinc-500 italic">/1000</span>
                    </div>
                    <p className={`text-[10px] mt-3 font-bold uppercase tracking-widest ${isWhitelisted ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {isWhitelisted ? 'Whitelisted — Vault Access Granted' : 'Score < 500 — Vault Access Denied'}
                    </p>
                  </div>

                  <div className="bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                      <Server size={14} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Vault Total Assets</span>
                    </div>
                    <div className="text-3xl font-bold text-indigo-100 font-mono tracking-tight">
                      {totalAssetsFormatted}
                      <span className="text-xs font-normal text-indigo-400/60 uppercase ml-2">AUSD</span>
                    </div>
                    <p className="text-[10px] text-indigo-400/60 mt-3 font-bold uppercase tracking-widest">
                      {utilization}% Utilization
                    </p>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      <Activity size={48} />
                    </div>
                  </div>
                </div>

                {/* Operation Panel */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase text-white tracking-[0.2em] flex items-center gap-3">
                      <Wallet size={14} className="text-indigo-500" /> Liquidity Gate
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
                      Wallet: <span className="text-zinc-300">{ausdBalanceFormatted} AUSD</span>
                    </span>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Deposit */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em]">Supply AUSD</label>
                      <div className="relative">
                        <input
                          type="number" value={depositAmt}
                          onChange={e => setDepositAmt(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 px-6 text-2xl font-mono text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-base font-bold text-zinc-500 italic">AUSD</span>
                      </div>
                    </div>

                    {/* Withdraw */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em]">Withdraw Shares</label>
                      <div className="relative">
                        <input
                          type="number" value={withdrawAmt}
                          onChange={e => setWithdrawAmt(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 px-6 text-2xl font-mono text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-base font-bold text-zinc-500 italic">SHARES</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button onClick={handleDeposit} disabled={isTxPending || !depositAmt}
                        className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed col-span-1">
                        {isTxPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                        Supply
                      </button>
                      <button onClick={handleWithdraw} disabled={isTxPending || !withdrawAmt}
                        className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed col-span-1">
                        {isTxPending ? <Loader2 size={14} className="animate-spin" /> : null}
                        Withdraw
                      </button>
                      <button onClick={handleClaimYield} disabled={isTxPending || parseFloat(pendingYieldFormatted) === 0}
                        className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed col-span-1">
                        <Zap size={14} /> Claim Yield
                      </button>
                    </div>

                    <div className="bg-zinc-950/80 border border-dashed border-indigo-500/10 rounded-xl p-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Trustless Handshake Active</p>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-0.5">
                          Every action generates an immutable EAS attestation on OKX X Layer Testnet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — telemetry */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl min-h-[400px]">
                  <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase text-white tracking-[0.2em] flex items-center gap-2">
                      <TerminalIcon size={14} className="text-emerald-500" /> Operation Telemetry
                    </h3>
                    <div className="flex gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                      <div className="w-1 h-1 rounded-full bg-emerald-500/20" />
                    </div>
                  </div>
                  <div className="flex-1 p-5 font-mono text-[10px] overflow-y-auto space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className={`flex items-start gap-3 border-l-2 pl-3 animate-in fade-in slide-in-from-left-2 duration-300 ${
                        log.type === 'success' ? 'border-emerald-500 text-emerald-400' :
                        log.type === 'err' ? 'border-rose-500 text-rose-400' :
                        'border-indigo-500 text-zinc-400'
                      }`}>
                        <span className="opacity-30 italic font-bold flex-shrink-0">
                          [{new Date().toLocaleTimeString([], { hour12: false })}]
                        </span>
                        <p className="flex-1 font-bold leading-relaxed">{log.msg}</p>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-10">
                        <Activity size={48} strokeWidth={1} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Awaiting Uplink...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-950/30 to-zinc-950 border border-indigo-500/20 p-6 rounded-2xl shadow-xl space-y-5">
                  <div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Agent Performance</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Live Attribution</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Credit Score', val: `${creditScore}/1000`, color: 'indigo' },
                      { label: 'Vault Access', val: isWhitelisted ? 'GRANTED' : 'DENIED', color: isWhitelisted ? 'emerald' : 'rose' },
                      { label: 'Network', val: 'X-LAYER', color: 'indigo' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-zinc-800/50 pb-2.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{s.label}</span>
                        <span className={`text-[10px] font-mono font-bold text-${s.color}-400`}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('LEADERBOARD')}
                    className="w-full py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-white uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                    View Leaderboard <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Autonomous Control</h4>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Manual Rebalance</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isAuditing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium pb-2">
                    Force an immediate audit of performance metrics and re-anchoring of EAS reputation.
                  </p>
                  <button
                    onClick={handleTriggerAudit}
                    disabled={isAuditing}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {isAuditing ? 'Auditing System...' : 'Trigger Audit Cycle'}
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

      <footer className="mt-20 border-t border-zinc-900 bg-[#070707] p-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />
            <span>Aetherial Prime © 2026</span>
          </div>
          <Link href="/docs" className="hover:text-zinc-300 transition-colors">Whitepaper</Link>
        </div>
        <div className="mt-6 sm:mt-0 flex items-center gap-4">
          <div className="flex items-center gap-2 py-1 px-3 bg-zinc-900/50 rounded-full border border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>X-Layer Testnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
