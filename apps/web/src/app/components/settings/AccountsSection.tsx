import { useState } from 'react';
import { Plus, CreditCard as  Wallet, Edit2, Power, PowerOff } from 'lucide-react';
import { AccountType } from '@monetria/enums';
import { useAuthStore, useFinanceStore } from '@/app/store';
import { Modal } from '@/app/components/Modal';
import { AccountForm } from '@/app/components/accounts';
import { EmptyState, LoadingState, ErrorBanner } from '@/app/components/shared';
import { Button } from '@/app/components/ui/Button';
import { useAccounts } from '@/app/hooks';
import type { Account } from '@/app/types/models';

import { FILTER_TABS, TYPE_CONFIG, CURRENCY_SYMBOL } from '@/app/constants/account';

function formatBalance(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOL[currencyCode] ?? currencyCode;
  const abs = Math.abs(amount).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return amount < 0 ? `-${symbol} ${abs}` : `${symbol} ${abs}`;
}

function getSubInfo(account: Account): string {
  const parts: string[] = [];
  if (account.institutionName) parts.push(account.institutionName);
  parts.push(account.currencyCode);
  if (account.cardLast4Digits) parts.push(`•••• ${account.cardLast4Digits}`);
  else if (account.statementClosingDay) parts.push(`Cierre día ${account.statementClosingDay}`);
  return parts.join(' · ');
}

interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
}

function AccountRow({ account, onEdit, onDeactivate, onReactivate }: AccountRowProps) {
  const config = TYPE_CONFIG[account.type];
  const isDebt = account.type === AccountType.CreditCard && account.currentBalance < 0;
  const inactive = !account.isActive;
  const subInfo = getSubInfo(account);
  const Icon = config?.icon ?? Wallet;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-opacity ${
        inactive ? 'opacity-50' : ''
      }`}
    >
      {/* Left color bar */}
      <div
        className="w-[3px] self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: account.colorCode }}
      />

      {/* Type icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          inactive ? 'bg-slate-200 dark:bg-slate-700/50' : config?.iconBg ?? 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        <Icon
          className={`w-4 h-4 ${
            inactive ? 'text-slate-400 dark:text-slate-500' : (config?.iconBg ?? '')
          }`}
        />
      </div>

      {/* Name + sub-info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {account.name}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              inactive
                ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                : (config?.badge ?? 'bg-slate-100 text-slate-500')
            }`}
          >
            {inactive ? 'Inactiva' : (config?.label ?? account.type)}
          </span>
        </div>
        {subInfo && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{subInfo}</p>
        )}
      </div>

      {/* Balance + actions */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span
          className={`text-sm font-semibold tabular-nums ${
            isDebt ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {formatBalance(account.currentBalance, account.currencyCode)}
        </span>
        <div className="flex gap-1.5">
          {inactive ? (
            <button
              onClick={() => onReactivate(account.id)}
              className="cursor-pointer p-1.5 text-slate-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 transition-colors"
            >
              <PowerOff className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onEdit(account)}
                className="cursor-pointer p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeactivate(account.id)}
                className="cursor-pointer p-1.5 text-slate-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountsSection() {
  const user = useAuthStore(s => s.user);
  const { accounts, addAccount, updateAccount, deleteAccount, reactivateAccount, isLoading, error } =
    useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');

  const active = accounts.filter(a => a.isActive);
  const inactive = accounts.filter(a => !a.isActive);

  const applyFilter = (list: Account[]) =>
    filter === 'all' ? list : list.filter(a => a.type === filter);

  const filteredActive = applyFilter(active);
  const filteredInactive = applyFilter(inactive);

  const netWorth = active.reduce((sum, a) => sum + a.currentBalance, 0);
  const primaryCurrency = active.find(a => a.currencyCode === 'PEN')?.currencyCode
    ?? active[0]?.currencyCode
    ?? 'PEN';

  return (
    <div className="space-y-4">
      {error && (
        <ErrorBanner
          message={error}
          onClose={() => useFinanceStore.setState({ error: null })}
        />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Mis Cuentas</h2>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4" />
            Nueva cuenta
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 m-4 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Total cuentas
            </p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{active.length} activas</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Patrimonio neto
            </p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">
              {formatBalance(netWorth, primaryCurrency)}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-4 flex-wrap">
          {FILTER_TABS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === val
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState message="Cargando cuentas…" />
        ) : filteredActive.length === 0 && filteredInactive.length === 0 ? (
          <div className="pb-4">
            <EmptyState
              icon={Wallet}
              message="Sin cuentas aún"
              description='Pulsa "Nueva cuenta" para agregar una.'
            />
          </div>
        ) : (
          <div className="pb-2">
            {filteredActive.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-5 pb-2">
                  Activas
                </p>
                {filteredActive.map(account => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onEdit={setEditingAccount}
                    onDeactivate={deleteAccount}
                    onReactivate={reactivateAccount}
                  />
                ))}
              </>
            )}

            {filteredInactive.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-5 pt-4 pb-2">
                  Inactivas
                </p>
                {filteredInactive.map(account => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onEdit={setEditingAccount}
                    onDeactivate={deleteAccount}
                    onReactivate={reactivateAccount}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Cuenta" size="lg">
        <AccountForm
          onSave={async data => {
            if (!user?.userId) throw new Error('Inicia sesión para crear una cuenta');
            await addAccount(data, user.userId);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        title="Editar Cuenta"
        size="lg"
      >
        {editingAccount && (
          <AccountForm
            initial={editingAccount}
            mode="edit"
            onSave={async data => {
              await updateAccount(editingAccount.id, data);
              setEditingAccount(null);
            }}
            onClose={() => setEditingAccount(null)}
          />
        )}
      </Modal>
    </div>
  );
}
