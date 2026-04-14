"use client";

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ArrowUpRight,
  BrainCircuit
} from 'lucide-react';

const ASSET_DATA = [
  { name: 'AUSD', value: 45, color: '#6366f1' },
  { name: 'USDC', value: 30, color: '#818cf8' },
  { name: 'ETH', value: 15, color: '#4f46e5' },
  { name: 'Others', value: 10, color: '#312e81' },
];

const PERFORMANCE_DATA = [
  { day: '01', pnl: 0 },
  { day: '05', pnl: 2.1 },
  { day: '10', pnl: 4.5 },
  { day: '15', pnl: 3.8 },
  { day: '20', pnl: 6.2 },
  { day: '25', pnl: 8.4 },
  { day: '30', pnl: 10.2 },
];

export function PortfolioAnalytics() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Portfolio Engine</h2>
          <p className="text-sm text-zinc-400 mt-1">Deep analytics and AI-driven performance attribution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Growth Attribution</h3>
            </div>
            <div className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
              +10.2% Total PnL
            </div>
          </div>
          
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Distribution</h3>
          </div>
          
          <div className="flex items-center justify-between flex-1">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ASSET_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ASSET_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col gap-3 flex-1 ml-8">
              {ASSET_DATA.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                    <span className="text-xs text-zinc-300 font-medium">{asset.name}</span>
                  </div>
                  <span className="text-xs text-white font-mono font-bold">{asset.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Intelligence Block */}
      <div className="group relative bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-indigo-500/30 transition-all">
        <div className="absolute top-0 right-0 p-4">
          <BrainCircuit size={40} className="text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
        </div>
        
        <div className="flex gap-4 items-start">
          <div className="hidden sm:flex flex-col items-center gap-1.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Score</span>
             <span className="text-xl font-bold text-white tracking-widest italic">A+</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Advanced Alpha Attribution</h4>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20">AI Optimized</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium max-w-2xl">
              Analysis indicates your portfolio is currently 15% overweight in USDC compared to the optimal risk-parity model for X-Layer. 
              Agentic rebalancing is scheduled for 18:00 UTC to reallocate into the Delta Neutral Prime vault, potentially increasing annualized yield by <span className="text-emerald-400 font-bold">1.2%</span>.
            </p>
            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors mt-2">
              Execute Rebalance <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
