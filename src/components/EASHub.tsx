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
    <tr className="hover:bg-white/[0.03] transition-all group border-b border-white/[0.03]">
      <td className="px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 border border-primary/20 rounded-xl">
            <FileCheck size={16} className="text-primary" />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Score Update</span>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-zinc-500 group-hover:text-white transition-colors">
          {shortUID}
          {easUID && easUID.startsWith('0x') && (
            <a href={`${EXPLORER_TX}${easUID}`} target="_blank" rel="noreferrer">
              <ExternalLink size={12} className="text-zinc-700 hover:text-primary transition-colors" />
            </a>
          )}
        </div>
      </td>
      <td className="px-8 py-6">
        <a href={`${EXPLORER_ADDR}${address}`} target="_blank" rel="noreferrer"
          className="text-[11px] text-zinc-500 font-mono font-bold hover:text-primary transition-colors">
          {shortAddr}
        </a>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-white font-black uppercase tracking-tight">
            Score: {creditScore} / 1000
          </span>
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            {isWhitelisted ? 'Whitelisted' : 'Restricted'}
          </span>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 w-fit">
          <CheckCircle2 size={12} strokeWidth={3} /> Verified
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          <Clock size={12} />
          {lastUpdated > BigInt(0) ? timeAgo(lastUpdated) : '—'}
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
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-700">
        <AlertCircle size={32} strokeWidth={1} />
        <p className="text-sm font-bold uppercase tracking-widest">Contracts not deployed yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between bg-white/[0.01] p-10 rounded-[32px] border border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Governance <span className="text-primary/60">Transparency</span></h2>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Immutable audit trail • OKX X Layer Settlement</p>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search Records..."
            className="pl-14 pr-8 py-4 bg-black border border-white/5 rounded-2xl text-[11px] font-black text-white placeholder:text-zinc-800 focus:outline-none focus:border-primary/40 w-80 transition-all uppercase tracking-widest shadow-inner"
          />
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                {['Event', 'EAS Identifier', 'Agent Identity', 'Allocation Payload', 'Status', 'Timestamp'].map((h, i) => (
                  <th key={h} className={`px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-700">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Loading attestations...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-700 text-xs font-bold uppercase tracking-widest">
                  No attestations found
                </td></tr>
              ) : (
                filtered.map(addr => <AttestationRow key={addr} address={addr} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="px-10 py-8 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/20">
              <Lock size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Trustless Audit Trail Active</p>
              <p className="text-[11px] text-zinc-600 font-medium">Reputation data secured via Ethereum Attestation Service.</p>
            </div>
          </div>
          <a
            href={`${EXPLORER_ADDR}${deployments.eas.address}`}
            target="_blank" rel="noreferrer"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black transition-all border border-white/5 flex items-center gap-3 uppercase tracking-widest"
          >
            EAS Protocol <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
