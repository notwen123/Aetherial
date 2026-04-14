"use client";

import React, { useState, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Wallet, 
  Activity, 
  Shield, 
  Server, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  LayoutDashboard,
  Trophy,
  PieChart as AnalyticsIcon,
  ShieldCheck,
  Vault as VaultIcon,
  Lock
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatEther } from 'viem';
import Link from 'next/link';

import { useAetherial } from '@/hooks/useAetherial';
import { Leaderboard } from '@/components/Leaderboard';
import { Vaults } from '@/components/Vaults';
import { EASHub } from '@/components/EASHub';
import { PortfolioAnalytics } from '@/components/PortfolioAnalytics';

type Tab = 'DASHBOARD' | 'VAULTS' | 'ANALYTICS' | 'LEADERBOARD' | 'TRANSPARENCY';

export default function AetherialTerminal() {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [amount, setAmount] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'err'}[]>([]);
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { balance, deposit, refetchBalance } = useAetherial();

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info') => {
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (isConnected) {
      addLog(`System initialized. Connected to OKX X Layer.`, 'info');
      addLog(`Agent auditing active. Score: 942.`, 'success');
    }
  }, [isConnected]);

  const handleDeposit = async () => {
    if (!amount) return;
    setIsPending(true);
    addLog(`Initiating deposit of ${amount} AUSD...`, 'info');
    try {
      await deposit(amount);
      addLog(`Deposit successful! Tx anchored to EAS.`, 'success');
      setAmount('');
      refetchBalance();
    } catch (e: any) {
      addLog(`Failed: ${e.message || "User rejected"}`, 'err');
    } finally {
      setIsPending(false);
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
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={36} className="text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">Access Restricted</h1>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              Aetherial Terminal requires an authenticated prime broker session. Connect your wallet to access high-fidelity liquidity on OKX X Layer.
            </p>
          </div>
          <button 
            onClick={() => connect({ connector: injected() })}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
          >
            <Wallet size={18} />
            Authorize Connection
          </button>
          <Link href="/" className="block text-[10px] text-zinc-600 font-bold hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">
            Return to Mission Briefing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Shield className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-white tracking-tighter">AETHERIAL <span className="text-indigo-500 italic ml-0.5">PRIME</span></span>
          </Link>
          <div className="h-4 w-px bg-zinc-800 mx-2" />
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === item.id ? 'text-indigo-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <item.icon size={14} />
                {item.label}
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
            <span className="text-xs font-mono font-bold tracking-tight">{address?.slice(0,6)}...{address?.slice(-4)}</span>
          </div>
          <button 
            onClick={() => disconnect()}
            className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
            title="Terminate Session"
          >
            <Lock size={16} />
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-8">
        
        {/* Dynamic Inner Content */}
        <div className="min-h-[600px]">
          {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Left Column: Stats & Operations */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all hover:bg-zinc-900/60 group">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                      <Activity size={14} className="group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Available Liquidity</span>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono tracking-tight">
                      {balance ? parseFloat(formatEther(balance as bigint)).toFixed(2) : '0.00'} 
                      <span className="text-sm font-normal text-zinc-500 ml-2 italic">AUSD</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      <TrendingUp size={10} /> +12.5% Performance
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all hover:bg-zinc-900/60 group">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                       <ShieldCheck size={14} className="group-hover:text-amber-500 transition-colors" />
                       <span className="text-[10px] uppercase font-bold tracking-widest">Agent Trust Score</span>
                    </div>
                    <div className="text-3xl font-bold text-white italic tracking-tighter">942 <span className="text-sm font-normal text-zinc-500 italic">/1000</span></div>
                    <p className="text-[10px] text-zinc-600 mt-3 font-bold uppercase tracking-widest">Audited via Onchain OS</p>
                  </div>

                  <div className="bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                      <Server size={14} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Vault Allocation</span>
                    </div>
                    <div className="text-3xl font-bold text-indigo-100 font-mono tracking-tight">14.2% <span className="text-xs font-normal text-indigo-400/60 uppercase ml-1">APY</span></div>
                    <button className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 mt-3 hover:text-indigo-300 underline underline-offset-4 transition-colors">
                      Optimize Structure
                    </button>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      <Activity size={48} />
                    </div>
                  </div>
                </div>

                {/* Operation Panel */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                  <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase text-white tracking-[0.2em] flex items-center gap-3">
                      <Wallet size={14} className="text-indigo-500" />
                      Institutional Liquidity Gate
                    </h3>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">X-LAYER RPC: <span className="text-emerald-500">22ms</span></span>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-10">
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] ml-1">Supply Liquidity (AUSD)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-6 px-8 text-3xl font-mono text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                           <button className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:text-white transition-colors">MAX</button>
                           <span className="text-lg font-bold text-white tracking-widest italic pr-2">AUSD</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button 
                        onClick={handleDeposit}
                        disabled={isPending || !amount}
                        className="flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black py-5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {isPending ? 'Processing Logic...' : 'Supply Assets'}
                        <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                      <button className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 py-5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg active:scale-95">
                        Withdraw Prime
                      </button>
                    </div>

                    <div className="bg-zinc-950/80 border border-indigo-500/10 rounded-xl p-6 flex items-center gap-5 border border-dashed">
                       <div className="w-12 h-12 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-inner mt-0.5">
                          <Shield size={20} className="text-indigo-400" />
                       </div>
                       <div className="space-y-1">
                         <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Trustless Handshake Active</p>
                         <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-xl">
                           Aetherial Prime utilizes EAS-based reputation anchoring. Every supply action generates an immutable on-chain audit trail on OKX X Layer.
                         </p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Density Audit Feed */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm min-h-[400px]">
                  <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase text-white tracking-[0.2em] flex items-center gap-2">
                       <TerminalIcon size={14} className="text-emerald-500" />
                       Operation Telemetry
                    </h3>
                    <div className="flex gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-emerald-500" />
                       <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                       <div className="w-1 h-1 rounded-full bg-emerald-500/20" />
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 font-mono text-[10px] overflow-y-auto space-y-4">
                    {logs.map((log, i) => (
                      <div key={i} className={`flex items-start gap-4 border-l-2 pl-4 transition-all animate-in fade-in slide-in-from-left-2 duration-300 ${
                        log.type === 'success' ? 'border-emerald-500 text-emerald-400' : 
                        log.type === 'err' ? 'border-rose-500 text-rose-400' : 
                        'border-indigo-500 text-zinc-400'
                      }`}>
                        <span className="opacity-30 italic font-bold">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                        <p className="flex-1 font-bold leading-relaxed tracking-tight">{log.msg}</p>
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

                <div className="bg-gradient-to-br from-indigo-950/30 to-zinc-950 border border-indigo-500/20 p-8 rounded-2xl shadow-xl space-y-6">
                   <div className="space-y-1">
                     <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Agent Performance</h4>
                     <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Real-time Attribution Model</p>
                   </div>
                   
                   <div className="space-y-4">
                      {[
                        { label: 'Latency', val: '12ms', color: 'emerald', icon: Activity },
                        { label: 'Network', val: 'X-LAYER', color: 'indigo', icon: Server },
                        { label: 'Gas Score', val: 'OPTIMAL', color: 'indigo', icon: Zap }
                      ].map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-zinc-800/50 pb-3 group cursor-default">
                          <div className="flex items-center gap-2">
                             <s.icon size={12} className="text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                             <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">{s.label}</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold text-${s.color}-400`}>{s.val}</span>
                        </div>
                      ))}
                   </div>
                   
                   <button className="w-full mt-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-white uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                     Initialize Audit Trace <ChevronRight size={12} />
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

      {/* Industrial Footer */}
      <footer className="mt-20 border-t border-zinc-900 bg-[#070707] p-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-zinc-400">
             <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />
             <span>Aetherial Prime &copy; 2026</span>
          </div>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors block py-1">Whitepaper</span>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors block py-1">Security Audit</span>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors block py-1">Terms of Prime</span>
        </div>
        <div className="mt-6 sm:mt-0 flex items-center gap-6">
          <div className="flex items-center gap-2 py-1 px-3 bg-zinc-900/50 rounded-full border border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>X-Layer Native</span>
          </div>
          <span className="text-zinc-800 font-normal">|</span>
          <span className="text-zinc-700 font-mono tracking-tighter capitalize text-xs">v2.4.0-Stable-Audit-Passed</span>
        </div>
      </footer>
    </div>
  );
}
