"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Shield, Zap, Layers, 
  BarChart3, Cpu, Terminal as TerminalIcon,
  ChevronRight, Globe, Lock, Code2,
  Twitter, Github, MessageSquare,
  Activity, Star, Zap as ZapIcon,
  ShieldCheck, ArrowUpRight, Plus, Rocket
} from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useVelocity } from 'framer-motion';
import { useVaultStats, useAllAgents } from '@/hooks/useAetherial';

function ScrollSkew({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skew = useTransform(scrollVelocity, [-2000, 2000], [-5, 5]);
  const smoothSkew = useSpring(skew, { stiffness: 100, damping: 30 });

  return (
    <motion.div style={{ skewY: smoothSkew }} className="origin-center">
      {children}
    </motion.div>
  );
}

function Preloader({ onComplete }: { onComplete: () => void }) {
  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        // No Math.random - per global rules
        return prev + 4;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Aetherial Core</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Initializing Neural Cluster...</div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{percent}%</div>
        </div>
        <div className="relative h-[2px] w-full bg-zinc-900 overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_15px_rgba(163,230,53,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest animate-pulse">Checking TEE Integrity</div>
          <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest animate-pulse delay-100 text-right">EAS Handshake: Active</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const { totalAssetsFormatted, totalAllocatedFormatted, utilization } = useVaultStats();
  const { totalAgents } = useAllAgents();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 1.2]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const videoY = useTransform(smoothProgress, [0, 0.5], [0, 200]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 20,
      y: (clientY / innerHeight - 0.5) * 20
    });
  };

  const { openConnectModal } = useConnectModal();

  const handleLaunch = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else {
      router.push('/terminal');
    }
  };

  return (
    <main 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-black text-white selection:bg-primary selection:text-black overflow-x-hidden"
    >
      <AnimatePresence>
        {isLoading && <Preloader onComplete={() => { setIsLoading(false); setIsLoaded(true); }} />}
      </AnimatePresence>

      <ScrollSkew>
        {/* Cinematic Nav */}
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4"
        >
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-8 h-16 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 flex items-center justify-center group-hover:bg-primary/5 transition-all duration-500 overflow-hidden rounded-lg">
                <Image src="/logo.png" alt="Aetherial Logo" width={24} height={24} className="object-contain" />
              </div>
              <span className="text-sm font-black tracking-tighter uppercase py-1">Aetherial</span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              {['Protocol', 'Ecosystem', 'Governance', 'Docs'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-mono font-bold text-zinc-500 hover:text-primary transition-colors uppercase tracking-[0.4em]">{item}</a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLaunch}
                suppressHydrationWarning
                className="bg-primary text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 hover:scale-105 transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(163,230,53,0.2)]"
              >
                {isConnected ? 'Terminal' : 'Initialize'} <TerminalIcon size={12} />
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Section 1: Cinematic Hero */}
        <section className="relative h-[110vh] overflow-hidden bg-black flex items-center justify-center">
          <motion.div 
            style={{ y: videoY, opacity: heroOpacity, scale: heroScale }}
            className="absolute inset-0 z-0"
          >
            <video 
              src="/hero.webm" 
              autoPlay 
              muted 
              loop 
              playsInline
              className="w-full h-full object-cover brightness-[1.1] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          </motion.div>

          <AnimatePresence>
            {isLoaded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="relative z-10 w-full max-w-7xl px-6 flex flex-col items-center select-none"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center pointer-events-none">
                  <button
                    onClick={handleLaunch}
                    className="w-[320px] h-[60px] pointer-events-auto rounded-xl hover:bg-white/5 transition-colors border border-transparent"
                    aria-label="Enter Platform"
                  />
                </div>

                <div 
                  className="absolute bottom-20 flex gap-12 opacity-40 transition-transform duration-700 ease-out"
                  style={{ transform: `translate3d(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px, 0)` }}
                >
                   <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] flex items-center gap-3">
                     <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(163,230,53,0.5)]" /> 
                     X-LAYER CLUSTER: OPTIMAL
                   </div>
                   <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] flex items-center gap-3">
                     <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]" /> 
                     {totalAgents} AGENTS ONLINE
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Section 2: Industrial Stats */}
        <section className="relative z-20 py-48 bg-black border-y border-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 text-left">
              {[
                { label: 'ALLOCATED TVL', val: `$${totalAssetsFormatted}`, sub: 'REAL-TIME' },
                { label: 'CAPITAL DEPLOYED', val: `$${totalAllocatedFormatted}`, sub: 'ON-CHAIN' },
                { label: 'ACTIVE CLUSTERS', val: totalAgents.toString(), sub: 'VERIFIED' },
                { label: 'UTILIZATION', val: `${utilization}%`, sub: 'EFFICIENCY' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="space-y-4 group"
                >
                  <div className="text-[10px] font-mono text-zinc-600 uppercase font-bold tracking-[0.4em] group-hover:text-primary transition-colors">{stat.label}</div>
                  <div className="text-5xl font-black tracking-tighter text-white font-mono flex items-baseline gap-2">
                    {stat.val} 
                  </div>
                  <div className="text-[8px] font-bold text-zinc-800 uppercase tracking-[0.3em]">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Value Prop */}
        <section className="relative z-20 py-64 bg-black overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12">
              <div className="space-y-8 max-w-2xl">
                <div className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">System Architecture</div>
                <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] uppercase">
                  Precision <span className="text-zinc-800">Meets</span> <br/>Autonomy.
                </h2>
              </div>
              <Link 
                href="/terminal" 
                className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] border-b border-white/10 pb-2 hover:border-primary transition-colors"
              >
                Audit the Engine <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-stretch">
              <motion.div 
                whileHover={{ y: -10, rotateX: 4, rotateY: 4 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="md:col-span-4 bg-zinc-950 border border-zinc-900 rounded-[48px] p-10 relative overflow-hidden flex flex-col justify-center group cursor-default min-h-[350px]"
              >
                 <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                   <Image src="/5.png" alt="UI" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                 </div>
                 <div className="relative z-10 space-y-4">
                    <Zap className="text-primary" size={24} />
                    <h4 className="text-2xl font-black transition-colors group-hover:text-primary uppercase tracking-tight">Flash Rebalancers</h4>
                 </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="md:col-span-8 bg-zinc-950 border border-zinc-900 rounded-[48px] p-12 relative overflow-hidden flex flex-col justify-end group cursor-default min-h-[400px]"
              >
                <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-1000">
                  <Image src="/4.png" alt="UI" width={400} height={400} className="object-contain" />
                </div>
                <div className="relative z-10 space-y-6">
                  <Shield className="text-primary mb-4" size={40} />
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase underline decoration-primary/20 underline-offset-8">EAS Infrastructure.</h3>
                  <p className="text-zinc-500 max-w-md font-medium text-lg leading-[1.7]">The most secure on-chain verification layer for autonomous entities, integrated natively into the Aetherial dashboard.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10, rotateX: 4, rotateY: -4 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="md:col-span-4 bg-primary/5 border border-primary/10 rounded-[48px] p-12 flex flex-col justify-center gap-6 group cursor-default min-h-[350px]"
              >
                 <div className="text-5xl font-black text-primary font-mono tracking-tighter shadow-primary/20 drop-shadow-2xl">1.2ms</div>
                 <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-[0.4em] leading-relaxed">Execution latency on high-frequency vault rebalancing.</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10, rotateX: -2, rotateY: 2 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="md:col-span-4 bg-zinc-950 border border-zinc-900 rounded-[48px] p-12 relative overflow-hidden group cursor-default min-h-[350px]"
              >
                 <div className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                   <Image src="/6.png" alt="UI" width={300} height={300} />
                 </div>
                 <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">Recursive Vaults</h4>
                 <p className="text-zinc-500 font-medium leading-[1.7]">Dynamic allocation across multiple lending protocols for optimal delta-neutral returns.</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10, rotateX: -2, rotateY: -2 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="md:col-span-4 bg-[#A3E635] text-black rounded-[48px] p-12 relative overflow-hidden group cursor-pointer shadow-[0_0_50px_rgba(163,230,53,0)] hover:shadow-[0_0_50px_rgba(163,230,53,0.3)] transition-shadow duration-500 min-h-[350px]"
                onClick={handleLaunch}
              >
                <div className="absolute top-[-20%] right-[-10%] w-2/3 opacity-30 grayscale contrast-200 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <Image src="/8.png" alt="UI" width={500} height={500} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase">INITIALIZE <br/>THE FLEET.</h3>
                  <div className="flex items-center gap-2 font-black uppercase text-[10px] font-mono tracking-[0.5em]">
                    ACCESS TERMINAL <ArrowRight size={16} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 5: World's Best CTA Footer (Cinematic) */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
          <motion.div 
            style={{ 
              scale: useTransform(smoothProgress, [0.8, 1], [1.2, 1]),
              opacity: useTransform(smoothProgress, [0.85, 0.95], [0, 1])
            }}
            className="absolute inset-0 z-0"
          >
            <Image 
              src="/orbital.png" 
              alt="Orbital Data Center" 
              fill
              sizes="100vw"
              className="object-cover brightness-50 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </motion.div>

          <motion.div 
            style={{ 
              x: useTransform(smoothProgress, [0.8, 1], ["-10%", "10%"]),
              opacity: useTransform(smoothProgress, [0.9, 1], [0, 0.03])
            }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none"
          >
            <span className="text-[30vw] font-black tracking-tighter text-white">AETHERIAL</span>
          </motion.div>

          <div className="relative z-20 text-center space-y-12 max-w-5xl px-6">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl md:text-9xl font-bold tracking-tighter leading-none"
            >
              Ready to <span className="text-primary underline decoration-primary/20 underline-offset-[20px]">Initialize</span>?
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex flex-col items-center gap-12"
            >
              <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl leading-[1.7] font-medium">
                Deploy your assets into the most advanced agentic environment in the multiverse. Built for the era of sovereign code and automated alpha.
              </p>
              
              <button
                onClick={handleLaunch}
                className="group relative px-16 py-8 bg-primary text-black rounded-3xl text-sm font-black uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_80px_rgba(163,230,53,0.3)] hover:shadow-[0_0_120px_rgba(163,230,53,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Rocket size={18} /> INITIALIZE PRIME BROKER
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              </button>
            </motion.div>
          </div>
        </section>

        <footer className="py-20 bg-black border-t border-zinc-900 relative z-30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-20">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl">
                    <Image src="/logo.png" alt="Aetherial Logo" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="text-2xl font-bold tracking-tighter uppercase">Aetherial</span>
                </div>
                <p className="max-w-xs text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] leading-loose">
                  Industrial-grade trust layer for the agentic economy. Constructed on OKX X Layer.
                </p>
                <div className="flex gap-6 text-zinc-600">
                  <Twitter className="hover:text-primary cursor-pointer transition-colors" size={20} />
                  <Github className="hover:text-primary cursor-pointer transition-colors" size={20} />
                  <MessageSquare className="hover:text-primary cursor-pointer transition-colors" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
                {[
                  { title: 'Protocol', links: ['Terminal', 'Vaults', 'Governance'] },
                  { title: 'Ecosystem', links: ['EAS Hub', 'Uniswap', 'Aave'] },
                  { title: 'Safety', links: ['Audits', 'Status', 'TEE Docs'] }
                ].map(group => (
                  <div key={group.title} className="space-y-6">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{group.title}</h4>
                    <ul className="space-y-4">
                      {group.links.map(link => (
                        <li key={link} className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-primary cursor-pointer transition-colors">{link}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-20 mt-20 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-[0.5em]">© 2026 AETHERIAL PROTOCOL • DESIGNED FOR SOVEREIGN AGENTS</div>
              <div className="flex gap-10 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                <span className="hover:text-white cursor-pointer transition-colors">Audit Path</span>
                <span className="hover:text-white cursor-pointer transition-colors">Privacy Logic</span>
                <span className="hover:text-white cursor-pointer transition-colors">Terminus</span>
              </div>
            </div>
          </div>
        </footer>
      </ScrollSkew>
    </main>
  );
}
