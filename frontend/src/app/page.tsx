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
  Trophy
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useAetherial } from '@/hooks/useAetherial';
import { formatEther } from 'viem';

export default function AetherialDashboard() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [depositAmount, setDepositAmount] = useState('');
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { balance, deposit } = useAetherial();

  // Mock data for the Agentic Summer of 2026
  const agents = [
    { id: 1, name: "Alpha-Quantum", score: 982, pnl: "+12.4%", tvl: "$2.4M", status: "Active" },
    { id: 2, name: "Sentinel-Prime", score: 945, pnl: "+8.1%", tvl: "$1.2M", status: "Bidding" },
    { id: 3, name: "Ether-Void", score: 890, pnl: "+15.2%", tvl: "$850K", status: "Active" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30">
      
      {/* 1. Industrial Top Navigation */}
      <header className="h-16 border-b border-border flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-cyan-glow">
            <Zap size={18} className="text-background" fill="currentColor" />
          </div>
          <span className="font-bold tracking-tight text-xl">AETHERIAL</span>
          <div className="ml-4 px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-[10px] text-primary font-mono uppercase tracking-widest">
            X Layer Mainnet 2026
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-foreground/50 font-medium">
            <Activity size={14} className="text-green-400" />
            <span>X Layer: 12ms</span>
          </div>
          <button 
            onClick={() => isConnected ? disconnect() : connect({ connector: injected() })}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-accent/50 hover:bg-accent hover:border-foreground/20 transition-all text-sm font-medium"
          >
            <Wallet size={14} />
            {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* 2. Main Layout Grid */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Metrics & Leaderboard */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Hero Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/50 font-medium">Total Value Locked</span>
                <BarChart3 size={16} className="text-primary" />
              </div>
              <div className="text-2xl font-bold font-mono">$12,450,230</div>
              <div className="text-xs text-green-400 mt-1.5 flex items-center gap-1 font-medium">
                <ArrowUpRight size={12} />
                <span>+2.4% vs 24h</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/50 font-medium">Active Allocations</span>
                <Cpu size={16} className="text-secondary" />
              </div>
              <div className="text-2xl font-bold font-mono">47 Agents</div>
              <div className="text-xs text-foreground/30 mt-1.5 font-medium">
                Current Load: 78% Utilization
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/50 font-medium">Average $A_\alpha$ Score</span>
                <Trophy size={16} className="text-yellow-500" />
              </div>
              <div className="text-2xl font-bold font-mono">892 / 1000</div>
              <div className="text-xs text-secondary mt-1.5 font-medium">
                Network Quality: Elite
              </div>
            </div>
          </div>

          {/* Agent Leaderboard Table */}
          <section className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-accent/20">
              <h2 className="font-semibold flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Agent Credit Leaderboard
              </h2>
              <button className="text-xs text-primary font-bold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-widest text-foreground/30 font-bold bg-accent/10">
                    <th className="px-6 py-4">Agent Identifier</th>
                    <th className="px-6 py-4">Alpha Score ($A_\alpha$)</th>
                    <th className="px-6 py-4">Realized PnL</th>
                    <th className="px-6 py-4">TVL Managed</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-accent/30 transition-colors group cursor-pointer">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-border flex items-center justify-center font-bold text-xs text-foreground/50 group-hover:text-primary transition-colors">
                            AG-{agent.id}
                          </div>
                          <span className="font-semibold tracking-tight">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-primary font-bold">{agent.score}</td>
                      <td className="px-6 py-5 font-mono text-green-400 font-medium">{agent.pnl}</td>
                      <td className="px-6 py-5 font-mono text-foreground/70">{agent.tvl}</td>
                      <td className="px-6 py-5 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          agent.status === 'Active' ? 'bg-green-400/10 text-green-400' : 'bg-primary/10 text-primary'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Vault Operations */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border-primary/20 shadow-cyan-glow">
            <h3 className="font-bold text-lg mb-4 text-gradient">Prime Broker Vault</h3>
            <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
              Deposit liquidity to back elite AI agents on X Layer. Earn variable yield powered by the Aetherial Agent Auction.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-foreground/30 tracking-widest mb-1.5 block">Amount to Deposit</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00" 
                    className="w-full bg-accent/40 border border-border rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-primary/50 transition-all text-xl"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/30">AUSD</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-foreground/40 font-medium">Your Vault Deposit</span>
                <span className="text-green-400 font-bold font-mono text-base">
                  {balance ? formatEther(balance as bigint) : '0.00'} AUSD
                </span>
              </div>

              <button 
                onClick={() => deposit(depositAmount)}
                disabled={!isConnected || !depositAmount}
                className="w-full py-4 bg-primary text-background font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-cyan-glow flex items-center justify-center gap-2"
              >
                Supply Liquidity
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h4 className="font-bold text-xs uppercase tracking-widest text-foreground/30 mb-4">Reputation Attestation (EAS)</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-green-400" />
                </div>
                <div>
                  <div className="text-xs font-bold">Proof of PnL Issued</div>
                  <div className="text-[10px] text-foreground/30 font-mono">ID: 0x92f...ba2 (EAS)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/50 opacity-50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold">Risk Assessment Pending</div>
                  <div className="text-[10px] text-foreground/30 font-mono">Agent: Alpha-Quantum</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </main>

      {/* 3. Industrial Footer */}
      <footer className="h-14 border-t border-border flex items-center justify-between px-8 text-[10px] text-foreground/30 font-bold tracking-widest uppercase bg-accent/5 mt-auto">
        <div>© 2026 Aetherial Protocol • LabLab AI Hackathon</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-primary transition-colors">X Layer Explorer</a>
          <a href="#" className="hover:text-primary transition-colors">Reputation Registry</a>
        </div>
      </footer>
    </div>
  );
}
