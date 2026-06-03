import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { formatCurrency, getMonthKey, getCurrentMonthKey } from '../store/FinanceContext';
import { Transaction } from '../types/finance';
import { Modal } from '../components/Modal';
import { useFinanceStore } from '../store/FinanceStore';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { Select, Input } from '@/app/components/ui';
import { HeaderPage, PageContainer, EmptyState, LoadingState, ErrorBanner, SummaryCard } from '../components/shared';

export function Movements() {
  const { accounts, transactions, isLoading, error, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonthKey());

  const allMonths = useMemo(() => {
    const keys = new Set(transactions.map(t => getMonthKey(t.date)));
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterAccount !== 'all' && t.fromAccountId !== filterAccount) return false;
        if (filterMonth && getMonthKey(t.date) !== filterMonth) return false;
        if (
          search &&
          !t.description.toLowerCase().includes(search.toLowerCase()) &&
          !t.category.toLowerCase().includes(search.toLowerCase())
        ) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, filterAccount, filterMonth, search]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const allCategories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))).sort(), [transactions]);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    return new Date(parseInt(year), parseInt(month) - 1)
      .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
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
        subtitle={isLoading ? 'Cargando…' : `${filtered.length} movimientos`}
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
          <Input icon={<Search className="w-4 h-4" />} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">Todos los meses</option>
            {allMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
          </Select>
          <Select value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}>
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
            <option value="transfer">Transferencias</option>
          </Select>
          <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
            <option value="all">Todas las cuentas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Cargando movimientos…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Filter} message="No hay movimientos con estos filtros" />
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map(tx => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                account={accounts.find(a => a.id === tx.fromAccountId)}
                onEdit={setEditTx}
                onDelete={id => void handleDelete(id)}
              />
            ))}
          </div>
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
