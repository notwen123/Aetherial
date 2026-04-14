"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Shield, Zap, Layers, 
  BarChart3, Cpu, Terminal as TerminalIcon,
  ChevronRight, Globe, Lock, Code2,
  Twitter, Github, MessageSquare,
  Activity, Star, Zap as ZapIcon,
  ShieldCheck, ArrowUpRight, Plus
} from 'lucide-react';
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

  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Stage the entry for a cinematic sweep
    const timer = setTimeout(() => setIsLoaded(true), 200);
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans scroll-smooth overflow-x-hidden">
      {/* Floating Navigation */}
      <nav 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-5xl transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}
        style={{ transitionDelay: '800ms' }}
      >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-8 h-16 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500">
              <Cpu size={18} className="text-primary" />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase italic">Aetherial</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {['Protocol', 'Ecosystem', 'Governance', 'Docs'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[9px] font-black text-zinc-500 hover:text-primary transition-colors uppercase tracking-[0.3em]">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLaunch}
              className="bg-primary text-black px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 hover:scale-105 transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(163,230,53,0.2)]"
            >
              {isConnected ? 'Terminal' : 'Initialize'} <TerminalIcon size={12} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden bg-black flex items-center justify-center">
        {/* Layer 0: Background Environment */}
        <div className={`absolute inset-0 z-0 transition-all duration-[2000ms] ease-out ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-2xl'}`}>
          <video 
            src="/hero.webm" 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover brightness-[1.05] contrast-[1.08] saturate-[1.05]"
            style={{ 
              imageRendering: 'auto',
              filter: 'contrast(1.08) brightness(1.03)'
            }}
          />
        </div>

        {/* Layer 1: Spatial UI Interaction Layer */}
        <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-1000 delay-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          {/* Invisible 'Connect/Enter' Button mapped to video geometry */}
          <button
            onClick={handleLaunch}
            className="absolute top-[68%] left-1/2 -translate-x-1/2 w-[320px] h-[60px] cursor-pointer hover:bg-white/5 transition-colors border border-transparent rounded-lg"
            aria-label="Enter Platform"
          />
          
          {/* Subtle status indicators (kept for industrial feel, but minimal) */}
          <div 
            className="absolute bottom-[8%] left-1/2 -translate-x-1/2 pointer-events-none flex gap-10 items-center opacity-40"
            style={{ transform: `translate3d(${mousePos.x * 0.1}px, ${mousePos.y * 0.1}px, 0) translateX(-50%)` }}
          >
             <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-primary rounded-full" /> 
               Network Status: Online
             </div>
             <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> 
               42 active agents verifiably audited
             </div>
          </div>
        </div>

        {/* Cinematic Scrim (Minimal - only at extreme bottom) */}
        <div className="absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-black to-transparent z-[5]" />
        <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay z-20" />
      </section>

      {/* Protocol Stats - Integrated into Scene flow */}
      <section className="py-24 border-b border-zinc-950 bg-black relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
            <div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em] mb-3">Allocated TVL</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tighter text-white font-mono">$1.42B <span className="text-primary text-sm tracking-normal align-top">+12%</span></div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em] mb-3">Trades Executed</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tighter text-white font-mono">824.1K</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em] mb-3">EAS Attestations</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tighter text-white font-mono">12,042</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em] mb-3">Protocol Fees</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tighter text-white font-mono">$4.8M</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section id="protocol" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">The Agentic Cycle.</h2>
              <p className="text-lg text-zinc-500">Traditional prime brokers rely on trust and lawyers. Aetherial relies on TEE execution and EAS reputation logic.</p>
            </div>
            <Link href="/docs" className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/30 pb-1 hover:border-primary transition-all">Deep Dive Technicals →</Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: ZapIcon, 
                title: 'Autonomous Yield', 
                desc: 'Agents run 24/7 rebalancing vaults across Uniswap and Aave, governed by strictly encoded profit-sharing mandates.',
                stat: '15.2% Avg APY'
              },
              { 
                icon: ShieldCheck, 
                title: 'EAS Reputation', 
                desc: 'Every trade is anchored to the Ethereum Attestation Service. High-scoring agents earn "Reputation NFTs" to unlock more capital.',
                stat: '99.9% Verified'
              },
              { 
                icon: Activity, 
                title: 'X Layer Native', 
                desc: 'Built on OKX X Layer for sub-second trade finality and institutional-grade gas efficiency during heavy volatility cycles.',
                stat: '1.2s Finality'
              }
            ].map((pillar) => (
              <div key={pillar.title} className="group p-8 bg-zinc-950 border border-zinc-900 rounded-[32px] hover:border-primary/20 transition-all duration-500 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <pillar.icon size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                    <pillar.icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold">{pillar.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{pillar.desc}</p>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {pillar.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Economics Section */}
      <section className="py-32 bg-zinc-950/30 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative perspective-3000">
              <Image 
                src="/2.png" 
                alt="Agent Reputation" 
                width={800} 
                height={800} 
                className="w-full h-auto drop-shadow-[0_0_60px_rgba(163,230,53,0.1)] scale-105"
              />
            </div>
            <div className="space-y-10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Institutional Verification</h3>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-white italic">Immutable Authority.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  In the agentic era, credit is code. Our EAS-powered scoring engine analyzes agent performance, risk-adjusted returns, and strategy safety to issue dynamic on-chain reputation markers.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl">
                  <div className="text-primary font-bold text-lg mb-1 italic">950+</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Min. Credit for Premium Vaults</div>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl">
                  <div className="text-white font-bold text-lg mb-1 italic">5.2K</div>
                  <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest leading-none">Reputation NFTs Minted</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center text-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">EAS HUB Verified</div>
                    <div className="text-[9px] text-zinc-500 uppercase">Audit ID: 824-OKX-91</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section id="ecosystem" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Powered by the Frontier.</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Seamlessly integrated with the core infrastructure of the on-chain economy.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-900 border border-zinc-900 overflow-hidden rounded-[40px] shadow-2xl">
            {[
              { name: 'X Layer', label: 'Infrastructure', icon: Globe },
              { name: 'EAS', label: 'Trust Layer', icon: Shield },
              { name: 'Uniswap V4', label: 'Liquidity', icon: ZapIcon },
              { name: 'Aave', label: 'Lending', icon: Layers },
              { name: 'TEE', label: 'Security', icon: Lock },
              { name: 'Viem', label: 'Logic', icon: Code2 },
              { name: 'StitchMCP', label: 'Generation', icon: TerminalIcon },
              { name: 'Aetherial', label: 'Master Engine', icon: Cpu }
            ].map(partner => (
              <div key={partner.name} className="p-10 bg-black flex flex-col items-center justify-center text-center group hover:bg-zinc-950 transition-colors cursor-default">
                <partner.icon size={32} className="text-zinc-800 group-hover:text-primary transition-colors mb-6" />
                <div className="text-sm font-bold tracking-tight text-white mb-1">{partner.name}</div>
                <div className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{partner.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-50" />
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12 relative z-10">
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter italic">Ready to <span className="text-primary underline decoration-primary/30 underline-offset-8">Initalize</span>?</h2>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto">Join the decentralized liquidity revolution. 
            Deploy your assets into the most advanced agentic environment on OKX X Layer.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={handleLaunch}
              className="px-12 py-6 bg-primary text-black rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_40px_80px_-20px_rgba(163,230,53,0.4)]"
            >
              Enter the Terminal
            </button>
            <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <span className="w-10 h-px bg-zinc-800" />
              Developer Alpha v1.02
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-black border-t border-zinc-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <Cpu size={18} className="text-primary" />
                </div>
                <span className="text-lg font-bold tracking-tighter uppercase italic">Aetherial</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold uppercase tracking-widest">
                The leading agentic prime broker <br />
                on the OKX X Layer network.
              </p>
              <div className="flex gap-4">
                <Twitter size={18} className="text-zinc-600 hover:text-primary cursor-pointer" />
                <Github size={18} className="text-zinc-600 hover:text-primary cursor-pointer" />
                <MessageSquare size={18} className="text-zinc-600 hover:text-primary cursor-pointer" />
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">Platform</h4>
              <ul className="space-y-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                {['Terminal', 'Liquidity Hub', 'Agent Registry', 'Credit Scores'].map(l => (
                  <li key={l} className="hover:text-primary cursor-pointer transition-colors">{l}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">Resources</h4>
              <ul className="space-y-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                {['Documentation', 'Agent SDK', 'Audit Logs', 'Status'].map(l => (
                  <li key={l} className="hover:text-primary cursor-pointer transition-colors">{l}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">Newsletter</h4>
              <p className="text-xs text-zinc-600 mb-6 font-bold uppercase tracking-widest leading-loose">Get the latest agentic alpha delivered to your inbox.</p>
              <div className="flex gap-2">
                <input type="text" placeholder="GHOST@AETHERIAL.SH" className="bg-zinc-950 border border-zinc-900 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 flex-1" />
                <button className="bg-zinc-800 px-4 py-2 rounded-lg text-primary hover:bg-zinc-700 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-zinc-900/50">
            <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.4em]">© 2026 AETHERIAL PROTOCOL • ALL RIGHTS RESERVED</div>
            <div className="flex gap-8 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
              <span className="hover:text-white cursor-pointer">Privacy</span>
              <span className="hover:text-white cursor-pointer">Terms</span>
              <span className="hover:text-white cursor-pointer">Licensing</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
