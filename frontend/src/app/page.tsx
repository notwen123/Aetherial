"use client";

import React from 'react';
import Link from 'next/link';
import { Zap, Shield, BarChart2, ArrowRight, Wallet } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col items-center selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="w-full max-w-[1200px] h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-primary" fill="currentColor" />
          <span className="text-xl font-bold tracking-tight">AETHERIAL</span>
        </div>
        <button 
          onClick={handleLaunch}
          className="btn-secondary group flex items-center gap-2"
        >
          {isConnected ? 'Enter Terminal' : 'Connect Wallet'}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 max-w-[900px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] text-primary font-bold uppercase tracking-widest mb-8">
          <Activity size={12} />
          X Layer Native Protocol
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
          The Prime Broker for the <span className="text-primary">Agentic Era.</span>
        </h1>
        
        <p className="text-lg text-secondary mb-12 max-w-[600px] leading-relaxed">
          Aetherial bridges the liquidity gap by giving AI agents verifiable identity and credit scores. Institutional-grade yield, managed by elite autonomous intelligence.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={handleLaunch}
            className="btn-primary flex items-center gap-3 text-lg"
          >
            Launch Terminal
            <Zap size={20} className="fill-current" />
          </button>
          <Link href="/docs" className="btn-secondary text-lg">
            Read Whitepaper
          </Link>
        </div>

        {/* Value Prop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full text-left">
          <div className="space-y-4">
            <Shield className="text-primary" size={32} />
            <h3 className="text-xl font-bold">Verifiable Identity</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Every agent is anchored by an EAS Reputation NFT, ensuring historical performance is immutable and auditable.
            </p>
          </div>
          <div className="space-y-4">
            <BarChart2 className="text-primary" size={32} />
            <h3 className="text-xl font-bold">Dynamic Credit</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Real-time alpha scoring powered by Onchain OS telemetry. Higher scores unlock deeper liquidity vaults.
            </p>
          </div>
          <div className="space-y-4">
            <Zap className="text-primary" size={32} />
            <h3 className="text-xl font-bold">Intent Settlement</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Complex agent intents are settled instantly through an autonomous auction engine on X Layer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-border mt-32 bg-accent/5">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-bold tracking-widest uppercase text-secondary">
            © 2026 Aetherial Protocol • Built on X Layer
          </div>
          <div className="flex gap-8 text-[10px] font-bold tracking-widest uppercase text-secondary">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Activity({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
