import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { formatCurrency } from '../store/FinanceContext';
import { Modal } from '../components/Modal';
import { useAuthStore } from '../store/AuthStore';
import { useFinanceStore } from '../store/FinanceStore';
import { AccountType } from '../types/enums';
import { AccountCardGrid } from '../components/accounts/AccountCardGrid';
import { AccountForm } from '../components/accounts/AccountForm';
import { HeaderPage, PageContainer, EmptyState, LoadingState, ErrorBanner, SummaryCard } from '../components/shared';
import { useAccounts } from '../hooks/useAccounts';

const FILTER_TABS: [AccountType | 'all', string][] = [
  ['all', 'Todas'],
  [AccountType.CreditCard, 'Crédito'],
  [AccountType.BankAccount, 'Bancaria'],
  [AccountType.Cash, 'Efectivo'],
  [AccountType.Wallet, 'Billetera'],
];

export function Accounts() {
  const user = useAuthStore(s => s.user);
  const { accounts, addAccount, isLoading, error } = useAccounts();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');

  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.type === filter);

  const totalAvailable = accounts
    .filter(a => a.type !== AccountType.CreditCard)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalDebt = accounts
    .filter(a => a.type === AccountType.CreditCard)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <PageContainer>
      {error && (
        <ErrorBanner
          message={error}
          onClose={() => useFinanceStore.setState({ error: null })}
        />
      )}

      <HeaderPage
        title="Mis Cuentas"
        subtitle={isLoading ? 'Cargando cuentas…' : `${accounts.length} cuentas registradas`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Disponible (Débito + Efectivo)" value={formatCurrency(totalAvailable)} colorVariant="emerald" />
        <SummaryCard label="Deuda Tarjetas de Crédito" value={formatCurrency(totalDebt)} colorVariant="rose" />
        <SummaryCard label="Patrimonio Neto" value={formatCurrency(totalAvailable - totalDebt)} colorVariant="indigo" />
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

      {/* Contenido */}
      {isLoading ? (
        <LoadingState message="Cargando cuentas…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          message="No tienes cuentas aún"
          description='Pulsa "Nueva Cuenta" para agregar una.'
        />
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
    </PageContainer>
  );
}
