"use client";

import React from 'react';
import { 
  Vault, 
  ArrowUpRight, 
  Layers, 
  Shield, 
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';

const VAULT_DATA = [
  {
    id: "v-1",
    name: "X-Layer Alpha Vault",
    description: "Multi-strategy yield optimization using agentic routing across OKX DEX and Lending pools.",
    tvl: "$12.4M",
    apy: "18.4%",
    risk: "Medium",
    asset: "AUSD",
    status: "Active"
  },
  {
    id: "v-2",
    name: "Delta Neutral Prime",
    description: "Algorithmic basis trading strategy leveraging X Layer's low-latency execution.",
    tvl: "$42.1M",
    apy: "12.2%",
    risk: "Low",
    asset: "USDC",
    status: "Active"
  },
  {
    id: "v-3",
    name: "EVM Liquidity Engine",
    description: "Concentrated liquidity management for core pairs on OKX Swap.",
    tvl: "$8.2M",
    apy: "31.5%",
    risk: "High",
    asset: "ETH/WETH",
    status: "Active"
  }
];

export function Vaults() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Strategy Vaults</h2>
          <p className="text-sm text-zinc-400 mt-1">Institutional capital deployment via smart-orchestrated vaults.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors">
            <Zap size={14} /> Auto-Optimize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VAULT_DATA.map((vault) => (
          <div 
            key={vault.id}
            className="group flex flex-col bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
          >
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg group-hover:border-indigo-500/50 transition-colors">
                  <Vault size={24} className="text-zinc-400 group-hover:text-indigo-400" />
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  vault.risk === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                  vault.risk === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                  {vault.risk} Risk
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{vault.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {vault.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">APY</div>
                  <div className="text-lg font-bold text-white font-mono">{vault.apy}</div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">TVL</div>
                  <div className="text-lg font-bold text-white font-mono">{vault.tvl}</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-zinc-500" />
                <span className="text-xs text-zinc-300 font-bold">{vault.asset}</span>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                Connect Wallet <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Insight */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4 flex gap-4 items-start">
        <div className="p-2 bg-indigo-500/10 rounded flex-shrink-0">
          <Info size={18} className="text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-300">Agentic Insight</h4>
          <p className="text-xs text-indigo-300/60 leading-relaxed">
            Current performance indicates consistent alpha generated by Aether-Alpha in the X-Layer Alpha Vault. 
            Automated rebalancing has preserved 12bps of capital during the latest volatility spike.
          </p>
        </div>
      </div>
    </div>
  );
}
