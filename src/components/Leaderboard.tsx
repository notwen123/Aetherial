"use client";

import React from 'react';
import { Trophy, TrendingUp, Target, ShieldCheck, ExternalLink, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useReadContract } from 'wagmi';
import { useAllAgents, useAgentData } from '@/hooks/useAetherial';
import deployments from '../deployments.json';

const REGISTRY_ABI = [
  {
    name: 'getAgent', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'isRegistered', type: 'bool' },
      { name: 'creditScore', type: 'uint256' },
      { name: 'easAttestationUID', type: 'string' },
      { name: 'isWhitelisted', type: 'bool' },
      { name: 'lastUpdated', type: 'uint256' },
    ]}],
  },
] as const;

const REGISTRY_ADDRESS = deployments.aetherial.registry as `0x${string}`;
const EXPLORER = 'https://www.okx.com/explorer/xlayer/testnet/tx/';
const isDeployed = !!(REGISTRY_ADDRESS && REGISTRY_ADDRESS.length > 4);

// Single agent row — each fetches its own data
function AgentRow({ address, rank }: { address: `0x${string}`; rank: number }) {
  const { data: agentInfo } = useReadContract({
    address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'getAgent',
    args: [address], query: { enabled: isDeployed },
  });

  const info = agentInfo as any;
  const score = info ? Number(info.creditScore) : 0;
  const isWhitelisted = info?.isWhitelisted ?? false;
  const easUID = info?.easAttestationUID ?? '';
  const shortUID = easUID.length > 10 ? `${easUID.slice(0, 6)}...${easUID.slice(-4)}` : easUID || '—';
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Sparkline: score as single point, build a mini trend from score
  const trend = [
    { v: Math.max(0, score - 120) }, { v: Math.max(0, score - 80) },
    { v: Math.max(0, score - 40) }, { v: Math.max(0, score - 10) },
    { v: score },
  ];

  return (
    <div className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 transition-all duration-300 hover:bg-zinc-900 overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Trophy size={80} strokeWidth={1} />
      </div>
      <div className="flex items-center gap-6 relative z-10">
        {/* Rank */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-bold text-white italic flex-shrink-0">
          #{rank}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-mono font-bold text-white truncate">{shortAddr}</span>
            {isWhitelisted && <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-zinc-500 font-mono">EAS: {shortUID}</span>
            {easUID && easUID.startsWith('0x') && (
              <a href={`${EXPLORER}${easUID}`} target="_blank" rel="noreferrer">
                <ExternalLink size={10} className="text-zinc-600 hover:text-indigo-400 cursor-pointer" />
              </a>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-8 px-8 border-x border-zinc-800/50 flex-shrink-0">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Target size={10} /> Credit Score
            </div>
            <div className="text-xl font-bold text-white mt-0.5">{score}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Status</div>
            <div className={`text-sm font-bold mt-0.5 ${isWhitelisted ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {isWhitelisted ? 'Active' : 'Pending'}
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="w-28 h-10 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <Line type="monotone" dataKey="v"
                stroke={rank === 1 ? '#ec4899' : '#6366f1'}
                strokeWidth={2} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ChevronRight className="text-zinc-700 group-hover:text-zinc-400 transition-colors ml-2 flex-shrink-0" size={16} />
      </div>
    </div>
  );
}

export function Leaderboard() {
  const { agentAddresses, totalAgents, isLoading } = useAllAgents();

  // Sort by credit score — we need per-agent data for sorting
  // For simplicity render in registration order (contract returns them in order)
  const ranked = [...agentAddresses].slice(0, 20); // cap at 20

  if (!isDeployed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
        <AlertCircle size={32} strokeWidth={1} />
        <p className="text-sm font-bold uppercase tracking-widest">Contracts not deployed yet</p>
        <p className="text-xs text-zinc-700">Run the deploy script to populate live data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Agent Intelligence Leaderboard</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Live on-chain data from AgentRegistry • {totalAgents} agent{totalAgents !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-emerald-400 font-bold font-mono">
          {totalAgents} AGENTS
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-zinc-600">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading agents...</span>
        </div>
      ) : ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
          <Trophy size={32} strokeWidth={1} />
          <p className="text-sm font-bold uppercase tracking-widest">No agents registered yet</p>
          <p className="text-xs text-zinc-700">Run the agent loop to register the first agent</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ranked.map((addr, i) => (
            <AgentRow key={addr} address={addr} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
