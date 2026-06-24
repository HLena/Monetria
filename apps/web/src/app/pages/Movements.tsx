import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { formatCurrency, getMonthKey } from '../store/FinanceContext';
import { Transaction } from '../types/finance';
import { Modal } from '../components/Modal';
import { useFinanceStore } from '../store/FinanceStore';
import { useTransactionsPaginated, PAGE_SIZE } from '../hooks/useTransactionsPaginated';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { Select, Input } from '@/app/components/ui';
import { HeaderPage, PageContainer, EmptyState, LoadingState, ErrorBanner, SummaryCard, Pagination } from '../components/shared';

const MONTH_COUNT = 24;

function generateRecentMonths(): string[] {
  const now = new Date();
  return Array.from({ length: MONTH_COUNT }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return getMonthKey(d);
  });
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return new Date(parseInt(year), parseInt(month) - 1)
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

export function Movements() {
  const {
    items,
    summary,
    page,
    totalPages,
    setPage,
    filters,
    setFilter,
    isLoading,
    error,
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionsPaginated();

  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const recentMonths = useMemo(() => generateRecentMonths(), []);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const balance = totalIncome - totalExpenses;
  const totalCount = summary?.totalCount ?? 0;

  const subtitleText = isLoading
    ? 'Cargando…'
    : totalCount === 0
    ? '0 movimientos'
    : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} de ${totalCount} movimientos`;

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await deleteTransaction(id);
  };

  return (
    <PageContainer>
      {error && (
        <ErrorBanner
          message={error}
          onClose={() => useFinanceStore.setState({ error: null })}
        />
      )}

      <HeaderPage
        title="Movimientos"
        subtitle={subtitleText}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nuevo movimiento
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Ingresos" value={formatCurrency(totalIncome)} colorVariant="emerald" />
        <SummaryCard label="Gastos" value={formatCurrency(totalExpenses)} colorVariant="rose" />
        <SummaryCard
          label="Balance"
          value={formatCurrency(balance)}
          colorVariant="indigo"
          valueClassName={balance >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-400'}
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Buscar..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <Select value={filters.month} onChange={e => setFilter('month', e.target.value)}>
            <option value="">Todos los meses</option>
            {recentMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
          </Select>
          <Select value={filters.type} onChange={e => setFilter('type', e.target.value as typeof filters.type)}>
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
            <option value="transfer">Transferencias</option>
          </Select>
          <Select value={filters.categoryId} onChange={e => setFilter('categoryId', e.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={filters.accountId} onChange={e => setFilter('accountId', e.target.value)}>
            <option value="all">Todas las cuentas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Cargando movimientos…" />
        ) : items.length === 0 ? (
          <EmptyState icon={Filter} message="No hay movimientos con estos filtros" />
        ) : (
          <>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {items.map(tx => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  account={accounts.find(a => a.id === tx.fromAccountId)}
                  onEdit={setEditTx}
                  onDelete={id => void handleDelete(id)}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo movimiento">
        <TransactionForm onSave={async data => { await addTransaction(data); }} onClose={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar movimiento">
        {editTx && (
          <TransactionForm
            initial={editTx}
            onSave={async data => { await updateTransaction(editTx.id, data); setEditTx(null); }}
            onClose={() => setEditTx(null)}
          />
        )}
      </Modal>
    </PageContainer>
  );
}
