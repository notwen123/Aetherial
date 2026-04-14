"use client";

import React from 'react';
import { 
  FileCheck, 
  ExternalLink, 
  Clock, 
  ShieldAlert,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';

const ATTESTATIONS = [
  {
    uid: "0x82f...d92",
    schema: "Risk_Audit_v1",
    attester: "Aetherial_System",
    recipient: "AlphaVault_X1",
    time: "2 mins ago",
    data: "Liquidity: $12.4M | Risk: Low | Coverage: 100%",
    status: "Confirmed"
  },
  {
    uid: "0x11a...33e",
    schema: "Agent_Performance",
    attester: "XLayer_Oracle",
    recipient: "Agent_Alpha",
    time: "15 mins ago",
    data: "PnL: +1.2% | Trades: 42 | Success: 88%",
    status: "Confirmed"
  },
  {
    uid: "0x44b...ff2",
    schema: "Credit_Score_Update",
    attester: "Aetherial_Scoring",
    recipient: "User_0xbc...12",
    time: "1 hour ago",
    data: "New Score: 942 (+4 pts) | Trust: High",
    status: "Confirmed"
  }
];

export function EASHub() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">EAS Transparency Hub</h2>
          <p className="text-sm text-zinc-400 mt-1">Immutable on-chain attestations powered by Ethereum Attestation Service.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input 
            type="text" 
            placeholder="Search UID..." 
            className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
          />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">UID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipient</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Payload</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {ATTESTATIONS.map((att) => (
                <tr key={att.uid} className="hover:bg-zinc-900/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                        <FileCheck size={14} className="text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{att.schema.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-indigo-400 transition-colors cursor-help">
                      {att.uid}
                      <ExternalLink size={10} className="text-zinc-600" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-300 font-medium">{att.recipient}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-500 italic max-w-xs truncate">
                      {att.data}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-400/5 px-2 py-0.5 rounded-full border border-emerald-400/10 w-fit">
                      <CheckCircle2 size={12} />
                      {att.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 font-bold">
                      <Clock size={10} />
                      {att.time}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Verification Banner */}
        <div className="px-6 py-5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Lock size={14} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Trustless Infrastructure Verified</p>
              <p className="text-[10px] text-zinc-500">All agent actions are anchored to OKX X Layer via EAS for auditability.</p>
            </div>
          </div>
          <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-bold transition-all border border-zinc-700">
            View EAS Resolver
          </button>
        </div>
      </div>
    </div>
  );
}
