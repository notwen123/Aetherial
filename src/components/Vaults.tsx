"use client";

import React, { useState } from 'react';
import { Vault, ArrowUpRight, Layers, Zap, Info, Loader2, AlertCircle, TrendingUp, Lock } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Assets', value: `${totalAssetsFormatted} AUSD`, icon: Vault },
          { label: 'Available Liquidity', value: `${availableFormatted} AUSD`, icon: Layers },
          { label: 'Utilization', value: `${utilization}%`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <Icon size={14} className="text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{value}</div>
          </div>
        ))}
      </div>

      {/* LP Position */}
      {isConnected && (
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your Position</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Deposited Value</div>
              <div className="text-xl font-bold text-white font-mono">{lpAssetValueFormatted} AUSD</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Pending Yield</div>
              <div className="text-xl font-bold text-primary font-mono">{pendingYieldFormatted} AUSD</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Wallet Balance</div>
              <div className="text-xl font-bold text-zinc-300 font-mono">{ausdBalanceFormatted} AUSD</div>
            </div>
          </div>

          {parseFloat(pendingYieldFormatted) > 0 && (
            <button
              onClick={handleClaimYield}
              disabled={isTxPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isTxPending ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Claim {pendingYieldFormatted} AUSD Yield
            </button>
          )}
        </div>
      )}

      {/* Deposit / Withdraw */}
      {isConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deposit */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ArrowUpRight size={14} className="text-primary" /> Supply AUSD
            </h3>
            <div className="relative">
              <input
                type="number" value={depositAmt}
                onChange={e => setDepositAmt(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border border-zinc-900 rounded-xl py-4 px-5 text-xl font-mono text-white placeholder:text-zinc-800 focus:outline-none focus:border-primary/50 transition-all"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600">AUSD</span>
            </div>
            <button
              onClick={handleDeposit}
              disabled={isTxPending || !depositAmt}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-black rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTxPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Deposit
            </button>
          </div>

          {/* Withdraw */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Lock size={14} className="text-zinc-400" /> Withdraw Shares
            </h3>
            <div className="relative">
              <input
                type="number" value={withdrawAmt}
                onChange={e => setWithdrawAmt(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border border-zinc-900 rounded-xl py-4 px-5 text-xl font-mono text-white placeholder:text-zinc-800 focus:outline-none focus:border-primary/50 transition-all"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600">SHARES</span>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isTxPending || !withdrawAmt}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTxPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Withdraw
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950/20 border border-zinc-900/50 border-dashed rounded-xl p-8 text-center text-zinc-700">
          <p className="text-sm font-bold uppercase tracking-widest">Connect wallet to deposit or withdraw</p>
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
