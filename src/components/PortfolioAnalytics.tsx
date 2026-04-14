"use client";

import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, TrendingUp, ArrowUpRight, BrainCircuit, AlertCircle, Loader2 } from 'lucide-react';
import { useAetherial, useVaultStats } from '@/hooks/useAetherial';
import { useAccount } from 'wagmi';
import deployments from '../deployments.json';

const isDeployed = deployments.aetherial.vault !== '';

const COLORS = ['#6366f1', '#818cf8', '#4f46e5', '#312e81'];

export function PortfolioAnalytics() {
  const { address, isConnected } = useAccount();
  const {
    lpAssetValueFormatted,
    pendingYieldFormatted,
    ausdBalanceFormatted,
    lpShares,
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
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
        <AlertCircle size={32} strokeWidth={1} />
        <p className="text-sm font-bold uppercase tracking-widest">Contracts not deployed yet</p>
      </div>
    );
  }

  // LP share % of vault
  const lpSharePct = lpShares && totalShares && totalShares > 0n
    ? ((Number(lpShares) / Number(totalShares)) * 100).toFixed(2)
    : '0.00';

  // Allocation donut data
  const allocatedNum = parseFloat(totalAllocatedFormatted === '—' ? '0' : totalAllocatedFormatted);
  const availableNum = parseFloat(availableFormatted === '—' ? '0' : availableFormatted);
  const totalNum = allocatedNum + availableNum;

  const pieData = totalNum > 0
    ? [
        { name: 'Allocated', value: allocatedNum, color: '#6366f1' },
        { name: 'Available', value: availableNum, color: '#27272a' },
      ]
    : [{ name: 'Empty', value: 1, color: '#27272a' }];

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Portfolio Engine</h2>
          <p className="text-sm text-zinc-400 mt-1">Live vault analytics from X Layer Testnet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Chart */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vault Utilization</h3>
            </div>
            <div className="text-xs text-indigo-400 font-bold bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">
              {utilization}% Active
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="t" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  formatter={(v: any) => [`${v}%`, 'Utilization']}
                />
                <Line type="monotone" dataKey="u" stroke="#6366f1" strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Donut */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Capital Distribution</h3>
          </div>
          <div className="flex items-center justify-between flex-1">
            <div className="h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                    paddingAngle={pieData.length > 1 ? 4 : 0} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-4 flex-1 ml-8">
              {[
                { label: 'Total Assets', value: `${totalAssetsFormatted} AUSD`, color: '#6366f1' },
                { label: 'Allocated', value: `${totalAllocatedFormatted} AUSD`, color: '#818cf8' },
                { label: 'Available', value: `${availableFormatted} AUSD`, color: '#27272a' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full border border-zinc-700" style={{ backgroundColor: color }} />
                    <span className="text-xs text-zinc-400 font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-white font-mono font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LP Position card */}
      {isConnected && (
        <div className="group relative bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4">
            <BrainCircuit size={40} className="text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
          </div>
          <div className="flex gap-4 items-start">
            <div className="hidden sm:flex flex-col items-center gap-1.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Share</span>
              <span className="text-lg font-bold text-white font-mono">{lpSharePct}%</span>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Your LP Position</h4>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20">Live</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                {[
                  { label: 'Asset Value', value: `${lpAssetValueFormatted} AUSD` },
                  { label: 'Pending Yield', value: `${pendingYieldFormatted} AUSD` },
                  { label: 'Wallet Balance', value: `${ausdBalanceFormatted} AUSD` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{value}</div>
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
