import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../store/FinanceContext';
import { Modal } from '../components/Modal';
import { useAuthStore } from '../store/AuthStore';
import { useFinanceStore } from '../store/FinanceStore';
import { AccountType } from '../types/enums';
import { AccountCardGrid } from '../components/accounts/AccountCardGrid';
import { AccountForm } from '../components/accounts/AccountForm';

const FILTER_TABS: [AccountType | 'all', string][] = [
  ['all', 'Todas'],
  [AccountType.CreditCard, 'Crédito'],
  [AccountType.BankAccount, 'Bancaria'],
  [AccountType.Cash, 'Efectivo'],
  [AccountType.Wallet, 'Billetera'],
];

export function Accounts() {
  const user = useAuthStore(s => s.user);
  const { accounts, addAccount, loadAccounts, isLoading, error } = useFinanceStore();

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      void loadAccounts(useAuthStore.getState().user?.userId ?? '');
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [loadAccounts]);

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');

  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.type === filter);

  const totalAvailable = accounts
    .filter(a => a.type !== AccountType.CreditCard)
    .reduce((sum, a) => sum + a.initialBalance, 0);
  const totalDebt = accounts
    .filter(a => a.type === AccountType.CreditCard)
    .reduce((sum, a) => sum + a.initialBalance, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex justify-between gap-3 items-start"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => useFinanceStore.setState({ error: null })}
            className="shrink-0 text-rose-600 dark:text-rose-300 font-medium hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">Mis Cuentas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isLoading ? 'Cargando cuentas…' : `${accounts.length} cuentas registradas`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900">
          <p className="text-emerald-600 dark:text-emerald-400 text-sm">Disponible (Débito + Efectivo)</p>
          <p className="text-emerald-700 dark:text-emerald-300 text-2xl font-bold mt-1">{formatCurrency(totalAvailable)}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-100 dark:border-rose-900">
          <p className="text-rose-600 dark:text-rose-400 text-sm">Deuda Tarjetas de Crédito</p>
          <p className="text-rose-700 dark:text-rose-300 text-2xl font-bold mt-1">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900">
          <p className="text-indigo-600 dark:text-indigo-400 text-sm">Patrimonio Neto</p>
          <p className="text-indigo-700 dark:text-indigo-300 text-2xl font-bold mt-1">{formatCurrency(totalAvailable - totalDebt)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === val
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de cuentas */}
      {!isLoading && filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
          No tienes cuentas aún. Pulsa «Nueva cuenta» para agregar una.
        </div>
      ) : (
        <AccountCardGrid accounts={filtered} />
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Agregar Cuenta" size="lg">
        <AccountForm
          onSave={async data => {
            if (!user?.userId) throw new Error('Inicia sesión para crear una cuenta');
            await addAccount(data, user.userId);
          }}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
