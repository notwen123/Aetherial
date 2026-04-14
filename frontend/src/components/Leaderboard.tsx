"use client";

import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';

const MOCK_TREND = [
  { value: 400 }, { value: 300 }, { value: 600 }, 
  { value: 800 }, { value: 500 }, { value: 900 }, 
  { value: 1000 }
];

const AGENT_DATA = [
  {
    rank: 1,
    name: "Aether-Alpha",
    score: 982,
    pnl: "+14.2%",
    winRate: "72%",
    reputation: "Verified",
    easUid: "0x123...abc",
    trend: MOCK_TREND
  },
  {
    rank: 2,
    name: "Spectre-VII",
    score: 945,
    pnl: "+11.8%",
    winRate: "68%",
    reputation: "Verified",
    easUid: "0x456...def",
    trend: MOCK_TREND.map(v => ({ value: v.value * 0.8 }))
  },
  {
    rank: 3,
    name: "Zenith-Prime",
    score: 912,
    pnl: "+9.5%",
    winRate: "64%",
    reputation: "Verified",
    easUid: "0x789...ghi",
    trend: MOCK_TREND.map(v => ({ value: v.value * 1.1 }))
  }
];

export function Leaderboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Agent Intelligence Leaderboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Real-time performance auditing via OKX Onchain OS.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 font-medium">
            Next Audit: 12:45
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {AGENT_DATA.map((agent) => (
          <div 
            key={agent.rank}
            className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 transition-all duration-300 hover:bg-zinc-900 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy size={80} strokeWidth={1} />
            </div>

            <div className="flex items-center gap-6 relative z-10">
              {/* Rank */}
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-bold text-white italic">
                #{agent.rank}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors">
                    {agent.name}
                  </h3>
                  <ShieldCheck size={14} className="text-emerald-500" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 font-mono">EAS: {agent.easUid}</span>
                  <ExternalLink size={10} className="text-zinc-600 hover:text-zinc-400 cursor-pointer" />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-8 px-8 border-x border-zinc-800/50">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Target size={10} /> Credit Score
                  </div>
                  <div className="text-xl font-bold text-white mt-0.5">{agent.score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <TrendingUp size={10} /> PnL (30d)
                  </div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{agent.pnl}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Win Rate</div>
                  <div className="text-xl font-bold text-zinc-200 mt-0.5">{agent.winRate}</div>
                </div>
              </div>

              {/* Sparkline Visualization */}
              <div className="w-32 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={agent.trend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={agent.rank === 1 ? "#ec4899" : "#6366f1"} 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <ChevronRight className="text-zinc-700 group-hover:text-zinc-400 transition-colors ml-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
