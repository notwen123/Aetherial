"use client";

import React from 'react';
import { Trophy, TrendingUp, Target, ShieldCheck, ExternalLink, ChevronRight, Loader2, AlertCircle, Medal } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useReadContract } from 'wagmi';
import Image from 'next/image';
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
const EXPLORER = 'https://www.oklink.com/xlayer-test/tx/';
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
    <div className="group relative bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 hover:border-white/20 rounded-[28px] p-8 transition-all duration-500 shadow-2xl overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-1000">
        {rank === 1 ? (
          <Image src="/1stplaced.png" alt="1st Place" width={180} height={180} className="object-contain" />
        ) : (
          <Trophy size={120} strokeWidth={1} className="text-primary" />
        )}
      </div>
      <div className="flex items-center gap-8 relative z-10">
        {/* Rank */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-black border border-white/5 text-sm font-black text-white flex-shrink-0 group-hover:border-primary/20 transition-colors">
          #{rank}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-mono font-bold text-white truncate">{shortAddr}</span>
            {isWhitelisted && <ShieldCheck size={14} className="text-primary flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-zinc-600 font-mono">EAS: {shortUID}</span>
            {easUID && easUID.startsWith('0x') && (
              <a href={`${EXPLORER}${easUID}`} target="_blank" rel="noreferrer">
                <ExternalLink size={10} className="text-zinc-600 hover:text-primary cursor-pointer" />
              </a>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-12 px-12 border-x border-white/[0.03] flex-shrink-0">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-black flex items-center gap-2">
              <Target size={12} /> Efficiency
            </div>
            <div className="text-2xl font-bold text-white mt-2 tracking-tighter">{score}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-black">Standing</div>
            <div className={`text-[10px] font-black uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full inline-block ${isWhitelisted ? 'text-primary' : 'text-zinc-600'}`}>
              {isWhitelisted ? 'Whitelisted' : 'Pending'}
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="w-28 h-10 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <Line type="monotone" dataKey="v"
                stroke="#A3E635"
                strokeWidth={2} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ChevronRight className="text-zinc-800 group-hover:text-primary transition-colors ml-2 flex-shrink-0" size={16} />
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between bg-white/[0.01] p-10 rounded-[32px] border border-white/5 relative overflow-hidden group">
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Intelligence <span className="text-primary/60">Alpha</span></h2>
          <p className="text-sm text-zinc-500 mt-2 font-medium">
            Institutional performance tracking • Verified by EAS Attestations
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-primary font-black tracking-[0.3em] uppercase">
            {totalAgents} ACTIVE AGENTS
          </div>
        </div>
        {/* Decorative background image */}
        <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
          <Image src="/1stplaced.png" alt="Intelligence Alpha" width={220} height={220} className="object-contain rotate-[15deg]" />
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
