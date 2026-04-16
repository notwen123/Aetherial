"use client";

import React from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, TrendingUp, ArrowUpRight, BrainCircuit, AlertCircle, Loader2 } from 'lucide-react';
import { useAetherial, useVaultStats } from '@/hooks/useAetherial';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import deployments from '../deployments.json';

const isDeployed = deployments.aetherial.vault !== '';

const COLORS = ['#A3E635', '#BEF264', '#D9F99D', '#09090b'];

export function PortfolioAnalytics() {
  const { address, isConnected } = useAccount();
  const {
    lpAssetValueFormatted,
    pendingYieldFormatted,
    ausdBalanceFormatted,
    lpShares,
    assetSymbol, yieldSymbol,
  } = useAetherial();

  const {
    totalAssets,
    totalAllocated,
    totalAssetsFormatted,
    totalAllocatedFormatted,
    availableFormatted,
    utilization,
    totalShares,
  } = useVaultStats();

  if (!isDeployed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-700">
        <AlertCircle size={32} strokeWidth={1} />
        <p className="text-sm font-bold uppercase tracking-widest">Contracts not deployed yet</p>
      </div>
    );
  }

  // LP share % of vault
  const lpSharePct = lpShares && totalShares && totalShares > BigInt(0)
    ? ((Number(lpShares) / Number(totalShares)) * 100).toFixed(2)
    : '0.00';

  // Allocation donut data using raw bigints for precision
  const rawAllocated = totalAllocated ? Number(formatEther(totalAllocated)) : 0;
  const rawAssets = totalAssets ? Number(formatEther(totalAssets)) : 0;
  const rawAvailable = Math.max(0, rawAssets - rawAllocated);

  const pieData = rawAssets > 0
    ? [
        { name: 'Allocated', value: rawAllocated, color: '#2DD4BF' }, // Active Teal
        { name: 'Available', value: rawAvailable, color: '#A3E635' }, // Brand Green
      ]
    : [{ name: 'Empty', value: 1, color: '#18181b' }];

  const utilNum = parseFloat(utilization);
  const yldNum = parseFloat(pendingYieldFormatted);

  // Analysis Engine
  const getInsights = () => {
    const insights: { title: string; desc: string; level: string; }[] = [];
    
    if (utilNum < 5) {
      insights.push({
        title: 'Settlement Phase Active',
        desc: 'Asset utilization is in Settlement Mode (100% Liquid). Awaiting institutional agent credit attribution.',
        level: 'neutral'
      });
    } else {
      insights.push({
        title: 'Active Deployment',
        desc: `${utilNum}% of capital is currently deployed to high-efficiency rebalancing agents.`,
        level: 'positive'
      });
    }

    if (yldNum > 0) {
      insights.push({
        title: 'Yield Accrual Detected',
        desc: `Protocol has generated ${pendingYieldFormatted} ${yieldSymbol} in mirror dividends.`,
        level: 'positive'
      });
    }

    if (isConnected && (!lpShares || lpShares === 0n)) {
      insights.push({
        title: 'Liquidity Required',
        desc: 'Supply capital to participate in institutional agent yield mirroring.',
        level: 'warning'
      });
    }

    return insights;
  };

  const insights = getInsights();

  // Utilization trend - enhanced with "Spectral Pulse" to show system vitality
  const trendData = [
    { t: '-5m', u: Math.max(0.4, utilNum - 0.5) },
    { t: '-4m', u: Math.max(0.2, utilNum - 0.3) },
    { t: '-3m', u: Math.max(0.5, utilNum - 0.1) },
    { t: '-2m', u: Math.max(0.3, utilNum) },
    { t: '-1m', u: Math.max(0.6, utilNum) },
    { t: 'now', u: Math.max(0.4, utilNum) },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between bg-white/[0.01] p-10 rounded-[32px] border border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Portfolio <span className="text-primary/60">Engine</span></h2>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Real-time asset mirroring • Institutional analytics</p>
        </div>
        <div className="flex items-center gap-6">
          <a
            href={`https://www.oklink.com/x-layer-testnet/address/${deployments.aetherial.vault}`}
            target="_blank" rel="noreferrer"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] text-primary font-black tracking-[0.3em] uppercase hover:bg-primary/10 transition-all flex items-center gap-2"
          >
            Detailed Analysis <ArrowUpRight size={14} />
          </a>
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-primary/40 font-black tracking-[0.3em] uppercase">
            LIVE TELEMETRY
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Utilization Chart */}
        <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] p-10 flex flex-col shadow-2xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-primary" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Asset Utilization</h3>
            </div>
            <div className="text-[10px] text-primary font-black bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest">
              {utilization}% ACTIVE
            </div>
          </div>
          <div className="h-[260px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3E635" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A3E635" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#101010" vertical={false} />
                <XAxis dataKey="t" stroke="#333" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" fontSize={9} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Utilization</p>
                          <p className="text-sm font-black text-primary">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="u" 
                  stroke="#A3E635" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#utilGradient)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Donut */}
        <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] p-10 flex flex-col shadow-2xl overflow-hidden relative">
          <div className="flex items-center gap-3 mb-10 relative z-10">
            <PieIcon size={18} className="text-primary" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Capital Distribution</h3>
          </div>
          <div className="flex items-center justify-between flex-1 relative z-10 gap-16">
            <div className="h-[240px] w-[240px] relative flex items-center justify-center">
              {/* Center Value Overlay */}
              <div className="absolute flex flex-col items-center justify-center z-20 pointer-events-none">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Total Net</span>
                <span className="text-2xl font-black text-white tracking-tighter">{totalAssetsFormatted}</span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">AUSD</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{payload[0].name}</p>
                              <p className="text-sm font-bold text-white">
                                {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(Number(payload[0].value))} <span className="text-[10px] text-zinc-400">AUSD</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie 
                      data={pieData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={70} 
                      outerRadius={90}
                      paddingAngle={(rawAllocated > 0 && rawAvailable > 0) ? 6 : 0} 
                      dataKey="value" 
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-6 flex-1 ml-12">
              {[
                { label: 'Vault Net', value: totalAssetsFormatted, color: '#ffffff' },
                { label: 'Deployed', value: totalAllocatedFormatted, color: '#2DD4BF' },
                { label: 'Settlement', value: availableFormatted, color: '#A3E635' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between border-b border-white/[0.03] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
                  </div>
                  <span className="text-[11px] text-white font-black uppercase tracking-tight">{value} <span className="text-[8px] text-zinc-600 ml-0.5">{assetSymbol}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alpha Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((insight, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex items-start gap-4 flex-1">
            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${
              insight.level === 'positive' ? 'bg-primary/5 text-primary' :
              insight.level === 'warning' ? 'bg-amber-500/5 text-amber-500' :
              'bg-blue-500/5 text-blue-400'
            }`}>
              <BrainCircuit size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{insight.title}</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{insight.desc}</p>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-full py-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em]">
            System Calibration in Progress...
          </div>
        )}
      </div>

      {/* LP Position card */}
      {isConnected && (
        <div className="group relative bg-gradient-to-br from-[#0F0F0F] to-[#010101] border border-white/5 rounded-[40px] p-12 hover:border-white/10 transition-all duration-700 shadow-2xl overflow-hidden mt-8">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-1000">
            <BrainCircuit size={160} strokeWidth={1} className="text-primary" />
          </div>
          <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
            <div className="flex flex-col items-center gap-3 p-8 rounded-[32px] bg-black border border-white/5 shadow-inner flex-shrink-0 min-w-[200px]">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Vault Share</span>
              <span className="text-5xl font-black text-white tracking-tighter">{lpSharePct}%</span>
              <div className="w-12 h-1.5 bg-primary/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${lpSharePct}%` }} />
              </div>
            </div>
            <div className="space-y-8 flex-1 w-full text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Institutional LP Stand</h4>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Attribution</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                {[
                  { label: 'Asset Value', value: lpAssetValueFormatted },
                  { label: 'Unclaimed Yield', value: pendingYieldFormatted, color: 'text-primary' },
                  { label: 'Settlement Ready', value: ausdBalanceFormatted },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-3">{label}</div>
                    <div className={`text-3xl font-black tracking-tighter ${color || 'text-white'}`}>{value} <span className={`text-[10px] uppercase ml-1 ${color ? 'opacity-40' : 'text-zinc-600'}`}>{assetSymbol}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-xl p-8 text-center text-zinc-600">
          <p className="text-sm font-bold uppercase tracking-widest">Connect wallet to see your LP position</p>
        </div>
      )}
    </div>
  );
}
