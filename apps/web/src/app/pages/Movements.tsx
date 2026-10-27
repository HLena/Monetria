import { useState } from 'react';
import { Plus, Filter, SlidersHorizontal, X } from 'lucide-react';
import { formatCurrency, useFinanceStore } from '@/app/store';
import { Modal } from '@/app/components/Modal';
import { useTransactions, PAGE_SIZE } from '@/app/hooks';
import type { TransactionFilters } from '@/app/hooks';
import { Transaction } from '@/app/types/finance';
import { TransactionForm, TransactionGroupedList } from '@/app/components/transactions';
import { Select } from '@/app/components/ui';
import { HeaderPage, PageContainer, EmptyState, LoadingState, ErrorBanner, SummaryCard, Pagination, CategorySelect } from '@/app/components/shared';
import { Button } from '@/app/components/ui/Button';

const TYPE_TABS: { value: TransactionFilters['type']; label: string }[] = [
  { value: 'all',      label: 'Todos'          },
  { value: 'income',   label: 'Ingresos'       },
  { value: 'expense',  label: 'Gastos'         },
  { value: 'transfer', label: 'Transferencias' },
];

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
  } = useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const balance = totalIncome - totalExpenses;
  const totalCount = summary?.totalCount ?? 0;

  const subtitleText = isLoading
    ? 'Cargando…'
    : totalCount === 0
    ? '0 movimientos'
    : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} de ${totalCount} movimientos`;

  const activeFilterCount = [
    filters.categoryId !== 'all',
    filters.accountId !== 'all',
    !!filters.startDate,
    !!filters.endDate,
  ].filter(Boolean).length;

  const hasAnyFilter = filters.type !== 'all' || activeFilterCount > 0;

  const clearFilters = () => {
    setFilter('type', 'all');
    setFilter('categoryId', 'all');
    setFilter('accountId', 'all');
    setFilter('startDate', '');
    setFilter('endDate', '');
  };

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
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo movimiento
          </Button>
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
      <div className="mb-4 space-y-3">
        {/* Row 1: Filtros button */}
        <div className='flex justify-between'>
          <div className="flex gap-2 flex-wrap">
            {TYPE_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter('type', value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  filters.type === value
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            {hasAnyFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowFilters(v => !v)}
              className={showFilters || activeFilterCount > 0 ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500' : ''}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>


        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CategorySelect
                options={[
                  { id: 'all', name: 'Todas las categorías', iconKey: null, color: null },
                  ...categories,
                ]}
                value={filters.categoryId}
                onChange={id => setFilter('categoryId', id)}
                placeholder="Todas las categorías"
              />
              <Select value={filters.accountId} onChange={e => setFilter('accountId', e.target.value)}>
                <option value="all">Todas las cuentas</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Desde</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilter('startDate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hasta</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilter('endDate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Cargando movimientos…" />
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <EmptyState icon={Filter} message="No hay movimientos con estos filtros" />
        </div>
      ) : (
        <>
          <TransactionGroupedList
            items={items}
            accounts={accounts}
            onEdit={setEditTx}
            onDelete={id => void handleDelete(id)}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

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
