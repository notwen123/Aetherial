"use client";

import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, TrendingUp, ArrowUpRight, BrainCircuit, AlertCircle, Loader2 } from 'lucide-react';
import { useAetherial, useVaultStats } from '@/hooks/useAetherial';
import { useAccount } from 'wagmi';
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

  // Allocation donut data
  const allocatedNum = parseFloat(totalAllocatedFormatted === '—' ? '0' : totalAllocatedFormatted);
  const availableNum = parseFloat(availableFormatted === '—' ? '0' : availableFormatted);
  const totalNum = allocatedNum + availableNum;

  const pieData = totalNum > 0
    ? [
        { name: 'Allocated', value: allocatedNum, color: '#A3E635' },
        { name: 'Available', value: availableNum, color: '#18181b' },
      ]
    : [{ name: 'Empty', value: 1, color: '#18181b' }];

  // Utilization trend (live single point — would be historical in prod)
  const utilizationNum = parseFloat(utilization);
  const trendData = [
    { t: '-5m', u: Math.max(0, utilizationNum - 5) },
    { t: '-4m', u: Math.max(0, utilizationNum - 3) },
    { t: '-3m', u: Math.max(0, utilizationNum - 1) },
    { t: '-2m', u: utilizationNum },
    { t: '-1m', u: utilizationNum },
    { t: 'now', u: utilizationNum },
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
            href={`https://web3.okx.com/portfolio/${deployments.aetherial.vault}/analysis`}
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
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#101010" vertical={false} />
                <XAxis dataKey="t" stroke="#333" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" fontSize={9} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', borderColor: '#111', borderRadius: '16px', border: '1px solid #222' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                  formatter={(v: any) => [`${v}%`, 'UTILITY']}
                />
                <Line type="monotone" dataKey="u" stroke="#A3E635" strokeWidth={4}
                  dot={{ r: 5, fill: '#000', stroke: '#A3E635', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#A3E635' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Donut */}
        <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] p-10 flex flex-col shadow-2xl overflow-hidden relative">
          <div className="flex items-center gap-3 mb-10 relative z-10">
            <PieIcon size={18} className="text-primary" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Capital Distribution</h3>
          </div>
          <div className="flex items-center justify-between flex-1 relative z-10">
            <div className="h-[220px] w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                    paddingAngle={pieData.length > 1 ? 6 : 0} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-6 flex-1 ml-12">
              {[
                { label: 'Vault Net', value: totalAssetsFormatted, color: '#A3E635' },
                { label: 'Deployed', value: totalAllocatedFormatted, color: '#BEF264' },
                { label: 'Settlement', value: availableFormatted, color: '#18181b' },
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
