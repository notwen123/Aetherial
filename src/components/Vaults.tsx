"use client";

import React, { useState } from 'react';
import { Vault, ArrowUpRight, Layers, Zap, Info, Loader2, AlertCircle, TrendingUp, Lock, ShieldCheck } from 'lucide-react';
import { useAetherial, useVaultStats } from '@/hooks/useAetherial';
import { useAccount } from 'wagmi';
import deployments from '../deployments.json';

const EXPLORER = 'https://www.okx.com/explorer/xlayer/testnet/address/';
const isDeployed = deployments.aetherial.vault !== '';

export function Vaults() {
  const { address, isConnected } = useAccount();
  const {
    lpAssetValueFormatted,
    pendingYieldFormatted,
    ausdBalanceFormatted,
    deposit, withdraw, claimYield,
    isTxPending, refetchAll, isDeployed: hookDeployed,
  } = useAetherial();

  const { totalAssetsFormatted, availableFormatted, utilization } = useVaultStats();

  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [status, setStatus] = useState<{ msg: string; type: 'info' | 'ok' | 'err' } | null>(null);

  const setMsg = (msg: string, type: 'info' | 'ok' | 'err') => setStatus({ msg, type });

  const handleDeposit = async () => {
    if (!depositAmt || parseFloat(depositAmt) <= 0) return;
    setMsg(`Approving & depositing ${depositAmt} AUSD...`, 'info');
    try {
      const tx = await deposit(depositAmt);
      setMsg(`Deposit confirmed. Tx: ${tx.slice(0, 10)}...`, 'ok');
      setDepositAmt('');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      setMsg(e.shortMessage ?? e.message ?? 'Transaction rejected', 'err');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt || parseFloat(withdrawAmt) <= 0) return;
    setMsg(`Withdrawing ${withdrawAmt} shares...`, 'info');
    try {
      const tx = await withdraw(withdrawAmt);
      setMsg(`Withdrawal confirmed. Tx: ${tx.slice(0, 10)}...`, 'ok');
      setWithdrawAmt('');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      setMsg(e.shortMessage ?? e.message ?? 'Transaction rejected', 'err');
    }
  };

  const handleClaimYield = async () => {
    setMsg('Claiming yield...', 'info');
    try {
      const tx = await claimYield();
      setMsg(`Yield claimed. Tx: ${tx.slice(0, 10)}...`, 'ok');
      setTimeout(refetchAll, 3000);
    } catch (e: any) {
      setMsg(e.shortMessage ?? e.message ?? 'Transaction rejected', 'err');
    }
  };

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
          <h2 className="text-xl font-semibold text-white tracking-tight">Strategy Vault</h2>
          <p className="text-sm text-zinc-400 mt-1">Live on-chain vault data from X Layer Testnet.</p>
        </div>
        <a
          href={`${EXPLORER}${deployments.aetherial.vault}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-primary transition-colors uppercase tracking-widest"
        >
          View Contract <ArrowUpRight size={12} />
        </a>
      </div>

      {/* Vault Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Assets', value: totalAssetsFormatted, unit: 'AUSD', icon: Vault },
          { label: 'Idle Capital', value: availableFormatted, unit: 'AUSD', icon: Layers },
          { label: 'Utilization', value: `${utilization}%`, unit: '', icon: TrendingUp },
        ].map(({ label, value, unit, icon: Icon }) => (
          <div key={label} className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[32px] p-10 hover:border-white/10 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-2 text-zinc-500 mb-6 relative z-10">
              <Icon size={14} className="group-hover:text-primary transition-colors" />
              <span className="text-[10px] uppercase font-bold tracking-[0.4em]">{label}</span>
            </div>
            <div className="text-4xl font-bold text-white tracking-tighter relative z-10">
              {value} <span className="text-sm font-bold text-zinc-600 ml-2">{unit}</span>
            </div>
            <div className="absolute bottom-[-20%] right-[-10%] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
              <Icon size={160} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      {/* LP Position */}
      {isConnected && (
        <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[32px] p-12 space-y-10 shadow-2xl">
          <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.4em] flex items-center gap-3">
            <ShieldCheck size={14} className="text-primary" /> Institutional Standing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-3">Allocated Capital</div>
              <div className="text-3xl font-bold text-white tracking-tighter">{lpAssetValueFormatted} <span className="text-xs text-zinc-600 ml-1">AUSD</span></div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-3">Accrued Yield</div>
              <div className="text-3xl font-bold text-primary tracking-tighter">{pendingYieldFormatted} <span className="text-xs text-primary/40 ml-1">AUSD</span></div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-3">Settlement Balance</div>
              <div className="text-3xl font-bold text-zinc-300 tracking-tighter">{ausdBalanceFormatted} <span className="text-xs text-zinc-600 ml-1">AUSD</span></div>
            </div>
          </div>

          {parseFloat(pendingYieldFormatted) > 0 && (
            <button
              onClick={handleClaimYield}
              disabled={isTxPending}
              className="px-8 py-4 bg-primary/10 border border-primary/20 hover:bg-primary hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isTxPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Claim Realized Profit
            </button>
          )}
        </div>
      )}

      {/* Deposit / Withdraw */}
      {isConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Deposit */}
          <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-xl">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <ArrowUpRight size={14} className="text-primary" /> Supply Capital
            </h3>
            <div className="relative group/input">
              <input
                type="number" value={depositAmt}
                onChange={e => setDepositAmt(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#080808] border border-white/5 rounded-3xl py-8 px-10 text-4xl font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:border-primary/40 transition-all shadow-inner"
              />
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 tracking-widest uppercase">AUSD</span>
            </div>
            <button
              onClick={handleDeposit}
              disabled={isTxPending || !depositAmt}
              className="w-full py-6 bg-primary hover:bg-primary/90 text-black rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(163,230,53,0.15)] hover:shadow-[0_0_40px_rgba(163,230,53,0.25)] flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {isTxPending ? <Loader2 size={20} className="animate-spin" /> : <ArrowUpRight size={20} strokeWidth={3} />}
              Initialize Supply
            </button>
          </div>

          {/* Withdraw */}
          <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-xl">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <Lock size={14} className="text-zinc-500" /> Liquidate Position
            </h3>
            <div className="relative group/input">
              <input
                type="number" value={withdrawAmt}
                onChange={e => setWithdrawAmt(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#080808] border border-white/5 rounded-3xl py-8 px-10 text-4xl font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:border-white/20 transition-all shadow-inner"
              />
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 tracking-widest uppercase">Shares</span>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isTxPending || !withdrawAmt}
              className="w-full py-6 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {isTxPending ? <Loader2 size={20} className="animate-spin" /> : null}
              Withdraw Capital
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-[40px] p-24 text-center group">
          <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-700">
            <Lock size={32} className="text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-black text-zinc-600 uppercase tracking-[0.4em]">Auth Required for Capital Flow</p>
        </div>
      )}

      {/* Status message */}
      {status && (
        <div className={`rounded-lg px-4 py-3 text-xs font-bold border ${
          status.type === 'ok' ? 'bg-primary/10 border-primary/20 text-primary' :
          status.type === 'err' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
          'bg-primary/5 border-primary/10 text-primary/70'
        }`}>
          {status.msg}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex gap-4 items-start">
        <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-primary/80">Yield Mechanics</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            When agents settle profitable trades, 85% of profit flows to LPs pro-rata.
            10% goes to the agent as performance fee. 5% to the protocol treasury.
            Yield accrues continuously and is claimable at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
