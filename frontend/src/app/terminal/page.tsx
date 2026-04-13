"use client";

import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  ArrowUpRight, 
  Wallet, 
  Activity,
  Cpu,
  Trophy,
  LayoutDashboard,
  Users,
  Database
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useAetherial } from '@/hooks/useAetherial';
import { formatEther } from 'viem';
import Link from 'next/link';

export default function AetherialTerminal() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [depositAmount, setDepositAmount] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState([
    { id: 1, time: "16:42:01", msg: "EAS Attestation verified for Alpha-Quantum", type: "success" },
    { id: 2, time: "16:41:55", msg: "Onchain OS: Rebalancing Vault [X-AUSD]", type: "info" },
    { id: 3, time: "16:41:42", msg: "Agent Sentinel-Prime bidding on intent #82a", type: "pending" },
  ]);
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { balance, deposit, refetchBalance } = useAetherial();

  const handleDeposit = async () => {
    if (!depositAmount) return;
    setTxStatus('pending');
    try {
      await deposit(depositAmount);
      setTxStatus('success');
      setLogs([{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: `Successfully deposited ${depositAmount} AUSD`, type: 'success' }, ...logs]);
      refetchBalance();
      setTimeout(() => setTxStatus('idle'), 5000);
    } catch (e) {
      setTxStatus('error');
      setLogs([{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: "Transaction failed: User rejected", type: 'error' }, ...logs]);
      setTimeout(() => setTxStatus('idle'), 5000);
    }
  };

  // Mock data for the Agentic Summer of 2026
  const agents = [
    { id: 1, name: "Alpha-Quantum", score: 982, pnl: "+12.4%", tvl: "2.4M", status: "Active" },
    { id: 2, name: "Sentinel-Prime", score: 945, pnl: "+8.1%", tvl: "1.2M", status: "Bidding" },
    { id: 3, name: "Ether-Void", score: 890, pnl: "+15.2%", tvl: "850K", status: "Active" },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-[400px] w-full glass-panel p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
          <p className="text-sm text-secondary leading-relaxed">
            The Aetherial Terminal requires a secure connection to the X Layer network. Please connect your wallet to access institutional liquidity.
          </p>
          <button 
            onClick={() => connect({ connector: injected() })}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Wallet size={18} />
            Connect Securely
          </button>
          <Link href="/" className="block text-xs text-primary font-bold hover:underline">
            Return to Landing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/20">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border flex flex-col p-6 gap-8 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-3 px-2">
          <Zap size={24} className="text-primary" fill="currentColor" />
          <span className="font-bold tracking-tighter text-xl">AETHERIAL</span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'leaderboard' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-secondary hover:bg-accent/50'}`}
          >
            <Users size={18} />
            Agent Ranking
          </button>
          <button 
            onClick={() => setActiveTab('vaults')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'vaults' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-secondary hover:bg-accent/50'}`}
          >
            <Database size={18} />
            Liquidity Vaults
          </button>
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'portfolio' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-secondary hover:bg-accent/50'}`}
          >
            <LayoutDashboard size={18} />
            My Portfolio
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="glass-panel p-4 overflow-hidden">
            <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Network Identity</div>
            <div className="text-xs font-mono text-primary truncate">{address}</div>
          </div>
          <button 
            onClick={() => disconnect()}
            className="w-full py-3 border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/10 transition-all uppercase tracking-widest"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Terminal */}
      <main className="flex-1 p-12 overflow-y-auto max-w-[1200px] mx-auto">
        
        {/* Header Region */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 uppercase">Aetherial // Terminal</h2>
            <div className="flex items-center gap-4 text-xs font-mono text-secondary">
              <span className="flex items-center gap-1.5"><Activity size={14} className="text-primary" /> X-LAYER-BLOCK-284192</span>
              <span>•</span>
              <span className="flex items-center gap-1.5 animate-pulse"><Zap size={14} className="text-yellow-500" /> GAS: 1.2 GWEI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 rounded uppercase tracking-widest">
                <ShieldCheck size={12} />
                Secure Session
             </div>
             <button className="btn-secondary flex items-center gap-2">
                <Activity size={16} />
                System Logs
             </button>
          </div>
        </header>

        {/* Dynamic Inner Tabs */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* High-Level Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-8">
                <div className="text-secondary text-xs font-bold uppercase tracking-widest mb-3">Total Protocol TVL</div>
                <div className="text-4xl font-bold tracking-tight">$12,450,230</div>
                <div className="mt-4 text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-1 inline-block rounded">+2.4% Δ 24H</div>
              </div>
              <div className="glass-panel p-8">
                <div className="text-secondary text-xs font-bold uppercase tracking-widest mb-3">Avg Agentic Alpha</div>
                <div className="text-4xl font-bold tracking-tight">892 / 1,000</div>
                <div className="mt-4 text-[10px] text-primary font-bold bg-primary/10 px-2 py-1 inline-block rounded">ELITE-TIER-VETING</div>
              </div>
              <div className="glass-panel p-8">
                <div className="text-secondary text-xs font-bold uppercase tracking-widest mb-3">Active Intent Auctions</div>
                <div className="text-4xl font-bold tracking-tight">12</div>
                <div className="mt-4 text-[10px] text-secondary font-bold bg-accent px-2 py-1 inline-block rounded">SETTLING...</div>
              </div>
            </div>

            {/* Main Ranking Table */}
            <div className="glass-panel overflow-hidden">
               <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-accent/20">
                <h3 className="font-bold flex items-center gap-2 tracking-tight">
                  <Trophy size={18} className="text-yellow-500" />
                  INSTITUTIONAL AGENT LEADERBOARD
                </h3>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Verified Score Real-time</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary bg-accent/10">
                    <th className="px-8 py-4">Agent Identifier</th>
                    <th className="px-8 py-4 text-center">$A_\alpha$ Alpha Score</th>
                    <th className="px-8 py-4 text-center">Realized Yield</th>
                    <th className="px-8 py-4 text-center">Managed Liquidity</th>
                    <th className="px-8 py-4 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-accent/30 transition-all cursor-pointer group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded border border-border flex items-center justify-center font-mono text-[10px] font-bold text-secondary group-hover:border-primary/50 group-hover:text-primary transition-all">
                            ID-{agent.id}
                          </div>
                          <span className="font-bold text-base tracking-tight">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-mono text-primary font-bold text-lg">{agent.score}</td>
                      <td className="px-8 py-6 text-center font-mono text-green-400 font-medium">{agent.pnl}</td>
                      <td className="px-8 py-6 text-center font-mono text-foreground/70">${agent.tvl}</td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                          agent.status === 'Active' ? 'bg-green-400/5 text-green-400 border-green-400/20' : 'bg-primary/5 text-primary border-primary/20'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vaults' && (
          <div className="grid grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="col-span-8 space-y-8">
              <div className="glass-panel p-10 bg-gradient-to-br from-card to-accent/20 border-primary/20 shadow-cyan-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <h3 className="text-4xl font-bold tracking-tight mb-4">Prime Broker Vault (X-AUSD)</h3>
                <p className="text-secondary mb-10 max-w-[500px] leading-relaxed">
                  Supply high-fidelity liquidity to be auctioned by elite AI agents. Every deployment is audited by the EAS reputation engine.
                </p>
                
                <div className="flex gap-12 mb-10 border-t border-border pt-10">
                  <div>
                    <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1">Current APY</div>
                    <div className="text-3xl font-bold text-green-400 tracking-tight">14.20%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1">Asset Support</div>
                    <div className="text-3xl font-bold tracking-tight">USDC / OKB</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1">Utilization</div>
                    <div className="text-3xl font-bold tracking-tight">84.1%</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00" 
                      disabled={txStatus === 'pending'}
                      className="w-full bg-accent/40 border border-border rounded-xl px-6 py-4 font-mono focus:outline-none focus:border-primary/50 transition-all text-2xl disabled:opacity-50"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-secondary/50">AUSD</div>
                  </div>
                  <button 
                    onClick={handleDeposit}
                    disabled={txStatus === 'pending'}
                    className={`btn-primary h-full px-12 text-lg flex items-center gap-3 ${
                      txStatus === 'pending' ? 'animate-pulse opacity-80' : 
                      txStatus === 'success' ? 'bg-green-500 text-white' : 
                      txStatus === 'error' ? 'bg-red-500 text-white' : ''
                    }`}
                  >
                    {txStatus === 'pending' ? 'Confirming...' : 
                     txStatus === 'success' ? 'Deposited' : 
                     txStatus === 'error' ? 'Failed' : 'Supply Liquidity'}
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>

              {/* Transaction Logs */}
              <div className="glass-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-accent/10 flex items-center gap-2">
                  <Database size={14} className="text-secondary" />
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">System Event Feed</span>
                </div>
                <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto font-mono text-[10px]">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-4">
                      <span className="text-secondary/50">[{log.time}]</span>
                      <span className={`${
                        log.type === 'success' ? 'text-green-400' : 
                        log.type === 'error' ? 'text-red-400' : 
                        log.type === 'pending' ? 'text-primary' : 'text-secondary'
                      }`}>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-4 space-y-8">
              <div className="glass-panel p-8">
                <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-6">Vault Statistics</h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm">Your Position</span>
                    <span className="font-mono font-bold">{balance ? formatEther(balance as bigint) : '0.00'} AUSD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm">Claimable Yield</span>
                    <span className="font-mono font-bold text-green-400">+0.00 AUSD</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-6">
                    <span className="text-secondary text-sm">Performance Fee</span>
                    <span className="font-mono font-bold">12.5%</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8">
                <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">REPUTATION PROOF (EAS)</h4>
                <div className="p-4 bg-accent/30 rounded border border-border/50 font-mono text-[10px] text-primary break-all leading-relaxed">
                  UID: 0x92f...ba2<br/>
                  ISSUER: Aetherial_Auditor<br/>
                  STATUS: VERIFIED
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty States for non-faked sections */}
        {activeTab === 'portfolio' && (
          <div className="flex flex-col items-center justify-center p-24 text-center space-y-6">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <Activity size={32} className="text-secondary" />
            </div>
            <h3 className="text-xl font-bold">Portfolio Indexing...</h3>
            <p className="text-secondary max-w-[400px]">We are synchronizing your on-chain positions with the Prime Brokerage vault. Please ensure your wallet session is active.</p>
          </div>
        )}

      </main>

    </div>
  );
}
