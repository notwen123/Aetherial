"use client";

import React, { useState } from 'react';
import { FileCheck, ExternalLink, Clock, Search, CheckCircle2, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { usePublicClient } from 'wagmi';
import { useAllAgents, useAgentData } from '@/hooks/useAetherial';
import deployments from '../deployments.json';

const EXPLORER_TX = 'https://www.okx.com/explorer/xlayer/testnet/tx/';
const EXPLORER_ADDR = 'https://www.okx.com/explorer/xlayer/testnet/address/';
const isDeployed = deployments.aetherial.registry !== '';

function timeAgo(ts: bigint): string {
  const seconds = Math.floor(Date.now() / 1000) - Number(ts);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// One row per agent
function AttestationRow({ address }: { address: `0x${string}` }) {
  const { agentInfo, creditScore, isWhitelisted, easUID } = useAgentData(address);

  if (!agentInfo) return null;

  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const shortUID = easUID.length > 10 ? `${easUID.slice(0, 8)}...${easUID.slice(-6)}` : easUID || '—';
  const lastUpdated = agentInfo.lastUpdated;

  return (
    <tr className="hover:bg-zinc-900/40 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
            <FileCheck size={14} className="text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-white">Credit Score Update</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-indigo-400 transition-colors">
          {shortUID}
          {easUID && easUID.startsWith('0x') && (
            <a href={`${EXPLORER_TX}${easUID}`} target="_blank" rel="noreferrer">
              <ExternalLink size={10} className="text-zinc-600 hover:text-indigo-400" />
            </a>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <a href={`${EXPLORER_ADDR}${address}`} target="_blank" rel="noreferrer"
          className="text-xs text-zinc-300 font-mono hover:text-indigo-400 transition-colors">
          {shortAddr}
        </a>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-zinc-500 italic">
          Score: {creditScore}/1000 | {isWhitelisted ? 'Whitelisted' : 'Pending'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-400/5 px-2 py-0.5 rounded-full border border-emerald-400/10 w-fit">
          <CheckCircle2 size={12} /> Confirmed
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 font-bold">
          <Clock size={10} />
          {lastUpdated > 0n ? timeAgo(lastUpdated) : '—'}
        </div>
      </td>
    </tr>
  );
}

export function EASHub() {
  const { agentAddresses, totalAgents, isLoading } = useAllAgents();
  const [search, setSearch] = useState('');

  const filtered = search
    ? agentAddresses.filter(a => a.toLowerCase().includes(search.toLowerCase()))
    : agentAddresses;

  if (!isDeployed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
        <AlertCircle size={32} strokeWidth={1} />
        <p className="text-sm font-bold uppercase tracking-widest">Contracts not deployed yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">EAS Transparency Hub</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Live attestations from AgentRegistry on X Layer Testnet • {totalAgents} records
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter by address..."
            className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 w-56 transition-all"
          />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                {['Type', 'EAS UID / Tx', 'Agent', 'Payload', 'Status', 'Age'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-3 text-zinc-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Loading attestations...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  No attestations found
                </td></tr>
              ) : (
                filtered.map(addr => <AttestationRow key={addr} address={addr} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Lock size={14} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Trustless Infrastructure Verified</p>
              <p className="text-[10px] text-zinc-500">All agent scores are anchored to OKX X Layer via EAS.</p>
            </div>
          </div>
          <a
            href={`${EXPLORER_ADDR}${deployments.eas.address}`}
            target="_blank" rel="noreferrer"
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-bold transition-all border border-zinc-700 flex items-center gap-1.5"
          >
            View EAS Contract <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
