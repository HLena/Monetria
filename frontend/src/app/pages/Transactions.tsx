import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { formatCurrency, getMonthKey, getCurrentMonthKey } from '../store/FinanceContext';
import { Transaction } from '../types/finance';
import { Modal } from '../components/Modal';
import { useFinanceStore } from '../store/FinanceStore';
import { useAuthStore } from '../store/AuthStore';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { SummaryCard } from '../components/ui/SummaryCard';
import { Select, Input } from '@/app/components/ui';

export function Transactions() {
  const {
    accounts,
    transactions,
    error,
    isLoading,
    loadAccounts,
    loadTransactions,
    loadCategories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonthKey());

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      const userId = useAuthStore.getState().user?.userId ?? '';
      void loadAccounts(userId);
      void loadCategories();
      void loadTransactions();
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [loadAccounts, loadTransactions, loadCategories]);

  const allMonths = useMemo(() => {
    const keys = new Set(transactions.map(t => getMonthKey(t.date)));
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;
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

  const allCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await deleteTransaction(id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">Transacciones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isLoading ? 'Cargando…' : `${filtered.length} movimientos`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </button>
      </div>

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
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">Todos los meses</option>
            {allMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </Select>
          <Select
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense' | 'transfer')}
          >
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

      {/* Transaction list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{isLoading ? 'Cargando transacciones…' : 'No hay transacciones con estos filtros'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map(tx => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                account={accounts.find(a => a.id === tx.accountId)}
                onEdit={setEditTx}
                onDelete={id => void handleDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Transacción">
        <TransactionForm
          onSave={async data => { await addTransaction(data); }}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar Transacción">
        {editTx && (
          <TransactionForm
            initial={editTx}
            onSave={async data => {
              await updateTransaction(editTx.id, data);
              setEditTx(null);
            }}
            onClose={() => setEditTx(null)}
          />
        )}
      </Modal>
    </div>
  );
}
