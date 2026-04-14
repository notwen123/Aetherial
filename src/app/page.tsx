"use client";

import React from 'react';
import Link from 'next/link';
import { Zap, Shield, BarChart2, ArrowRight, Activity } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const router = useRouter();

  const handleLaunch = () => {
    if (!isConnected) {
      connect({ connector: injected() });
    } else {
      router.push('/terminal');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center selection:bg-indigo-500/30">

      {/* Navigation */}
      <nav className="w-full max-w-[1200px] h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-indigo-400" fill="currentColor" />
          <span className="text-xl font-bold tracking-tight">AETHERIAL</span>
        </div>
        <button
          onClick={handleLaunch}
          className="group flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:border-indigo-500 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white transition-all"
        >
          {isConnected ? 'Enter Terminal' : 'Connect Wallet'}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 max-w-[900px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-8">
          <Activity size={12} />
          X Layer Native Protocol
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
          The Prime Broker for the{' '}
          <span className="text-indigo-400">Agentic Era.</span>
        </h1>

        <p className="text-lg text-zinc-400 mb-12 max-w-[600px] leading-relaxed">
          Aetherial bridges the liquidity gap by giving AI agents verifiable identity and credit scores.
          Institutional-grade yield, managed by elite autonomous intelligence.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleLaunch}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20"
          >
            Launch Terminal
            <Zap size={20} className="fill-current" />
          </button>
          <Link
            href="/docs"
            className="flex items-center gap-3 px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl font-bold text-lg transition-all"
          >
            Read Whitepaper
          </Link>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full text-left">
          <div className="space-y-4">
            <Shield className="text-indigo-400" size={32} />
            <h3 className="text-xl font-bold">Verifiable Identity</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Every agent is anchored by an EAS Reputation NFT, ensuring historical performance is immutable and auditable.
            </p>
          </div>
          <div className="space-y-4">
            <BarChart2 className="text-indigo-400" size={32} />
            <h3 className="text-xl font-bold">Dynamic Credit</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Real-time alpha scoring powered by OKX Onchain OS telemetry. Higher scores unlock deeper liquidity vaults.
            </p>
          </div>
          <div className="space-y-4">
            <Zap className="text-indigo-400" size={32} />
            <h3 className="text-xl font-bold">Intent Settlement</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Complex agent intents are settled instantly through an autonomous auction engine on X Layer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-zinc-900 mt-32">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-600">
            © 2026 Aetherial Protocol • Built on X Layer
          </div>
          <div className="flex gap-8 text-[10px] font-bold tracking-widest uppercase text-zinc-600">
            <a href="#" className="hover:text-indigo-400 transition-colors">Twitter</a>
            <Link href="/docs" className="hover:text-indigo-400 transition-colors">Documentation</Link>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
