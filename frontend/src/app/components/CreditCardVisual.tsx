import React from 'react';
import { Wifi, CreditCard } from 'lucide-react';
import { Account } from '../types/finance';
import { formatCurrency } from '../store/FinanceContext';

interface CreditCardVisualProps {
  account: Account;
  compact?: boolean;
}

export function CreditCardVisual({ account, compact = false }: CreditCardVisualProps) {
  const isCredit = account.type === 'credit';
  const isCash = account.type === 'cash';

  const availableCredit = isCredit
    ? (account.creditLimit ?? 0) - account.balance
    : account.balance;

  const usagePercent = isCredit && account.creditLimit
    ? (account.balance / account.creditLimit) * 100
    : 0;

  if (compact) {
    return (
      <div
        className="relative rounded-xl p-4 overflow-hidden text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${account.color}dd, ${account.color}88)`,
          minWidth: 200,
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium opacity-80">{account.bank || account.name}</span>
          {!isCash && <Wifi className="w-4 h-4 rotate-90 opacity-70" />}
        </div>
        <div className="mt-1">
          <p className="text-xs opacity-70">{isCredit ? 'Saldo' : 'Disponible'}</p>
          <p className="text-lg font-bold">{formatCurrency(account.balance)}</p>
        </div>
        {account.cardNumber && (
          <p className="text-xs opacity-60 mt-1">•••• {account.cardNumber}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden text-white shadow-xl select-none"
      style={{
        background: `linear-gradient(135deg, ${account.color}ff 0%, ${account.color}99 60%, ${account.color}44 100%)`,
        minHeight: 200,
        maxWidth: 400,
      }}
    >
      {/* Background circles */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.3)' }}
      />
      <div
        className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.4)' }}
      />

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-medium opacity-70 uppercase tracking-wider">
            {account.bank || 'Personal'}
          </p>
          <p className="text-sm font-semibold mt-0.5">{account.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {!isCash && <Wifi className="w-5 h-5 rotate-90 opacity-70" />}
          {isCredit ? (
            <span className="text-xs bg-white/20 rounded px-2 py-0.5 font-medium">CRÉDITO</span>
          ) : isCash ? (
            <span className="text-xs bg-white/20 rounded px-2 py-0.5 font-medium">EFECTIVO</span>
          ) : (
            <span className="text-xs bg-white/20 rounded px-2 py-0.5 font-medium">DÉBITO</span>
          )}
        </div>
      </div>

      {/* Chip */}
      {!isCash && (
        <div className="mt-4 relative z-10">
          <div className="w-10 h-7 rounded-md bg-yellow-300/70 border border-yellow-200/50" />
        </div>
      )}

      {/* Card Number */}
      <div className="mt-4 relative z-10">
        {account.cardNumber ? (
          <p className="text-lg font-mono tracking-widest opacity-90">
            •••• •••• •••• {account.cardNumber}
          </p>
        ) : (
          <p className="text-lg font-mono tracking-widest opacity-50">•••• •••• •••• ••••</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-end relative z-10">
        <div>
          <p className="text-xs opacity-60 uppercase tracking-wide">
            {account.cardHolder || 'Titular'}
          </p>
          {account.expiryDate && (
            <p className="text-xs opacity-60 mt-0.5">Vence: {account.expiryDate}</p>
          )}
        </div>
        <div className="text-right">
          {isCredit ? (
            <>
              <p className="text-xs opacity-60">Saldo actual</p>
              <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
              <p className="text-xs opacity-60">
                Disponible: {formatCurrency(availableCredit)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs opacity-60">Disponible</p>
              <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
            </>
          )}
        </div>
      </div>

      {/* Credit usage bar */}
      {isCredit && account.creditLimit && (
        <div className="mt-4 relative z-10">
          <div className="flex justify-between text-xs opacity-60 mb-1">
            <span>Uso de crédito</span>
            <span>{usagePercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(usagePercent, 100)}%`,
                background: usagePercent > 80 ? '#ef4444' : usagePercent > 60 ? '#f59e0b' : 'rgba(255,255,255,0.7)',
              }}
            />
          </div>
          <p className="text-xs opacity-50 mt-1">
            Límite: {formatCurrency(account.creditLimit)}
          </p>
        </div>
      )}
    </div>
  );
}
